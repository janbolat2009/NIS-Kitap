// Staff views and configuration: students, roles, settings, reports, audit,
// and the data migration from the previous version (with rollback).
import { db } from '../admin.js';
import { fail, str, bool, oneOf, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { getSchool, getRules, normalizeSchool } from '../settings.js';
import { rebuildAggregates } from './points.js';
import { mailStatus } from './mail.js';
import { normalizeRules, periodKeys, actionOf } from '../../../src/lib/points.js';
import { normalizeStatus, reservationCode, addHours, applyDelta, availability } from '../../../src/lib/loans.js';
import { cleanEmail, roleFromConfig, canAssignRole, configuredStaff, roleBlockReason } from '../../../src/lib/roles.js';
import { ASSIGNABLE_ROLES } from '../../../src/lib/permissions.js';
import { isAcademicYear } from '../../../src/lib/school.js';
import { catalogBook } from '../catalog.js';

const coll = (name) => db().collection(name);
const docs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

// ---------- students ----------
export async function listStudents(query = {}) {
  const school = await getSchool();
  const year = isAcademicYear(query.year) ? query.year : school.currentAcademicYear;
  const [profiles, points] = await Promise.all([coll('profiles').limit(5000).get(), coll('student_points').limit(5000).get()]);
  const pts = new Map(points.docs.map((d) => [d.id, d.data()]));
  const q = String(query.q || '').trim().toLowerCase();
  return docs(profiles)
    .filter((p) => !query.classId || p.classId === query.classId)
    .filter((p) => !query.shanyrakId || p.shanyrakId === query.shanyrakId)
    .filter((p) => !q || [p.email, p.firstName, p.lastName, p.className].some((v) => String(v || '').toLowerCase().includes(q)))
    .map((p) => {
      const s = pts.get(p.id) || {};
      return {
        uid: p.id,
        email: p.email,
        name: [p.firstName, p.lastName].filter(Boolean).join(' '),
        className: p.academicYear === year ? p.className : '',
        classYear: p.academicYear || '',
        shanyrakName: p.academicYear === year ? p.shanyrakName : '',
        emailVerified: p.emailVerified !== false,
        points: Number(s.years?.[year]?.total) || 0,
        totalPoints: Number(s.total) || 0,
        confirmedBooks: Number(s.confirmedBooks) || 0,
      };
    })
    .sort((a, b) => String(a.className).localeCompare(String(b.className)) || a.name.localeCompare(b.name));
}

export async function studentDetail(uid) {
  const id = idParam(uid, 'uid');
  const pSnap = await coll('profiles').doc(id).get();
  if (!pSnap.exists) fail(404, 'student_not_found');
  const [history, ledger, progress, reservations, rewards, points] = await Promise.all([
    coll('class_history').where('uid', '==', id).get(),
    coll('points_ledger').where('uid', '==', id).get(),
    coll('reading_progress').where('uid', '==', id).get(),
    coll('reservations').where('uid', '==', id).get(),
    coll('reward_issues').where('uid', '==', id).get(),
    coll('student_points').doc(id).get(),
  ]);
  const by = (key) => (a, b) => String(b[key] || '').localeCompare(String(a[key] || ''));
  return {
    profile: { uid: id, ...pSnap.data() },
    points: points.exists ? points.data() : null,
    classHistory: docs(history).sort(by('at')),
    ledger: docs(ledger).map((e) => ({ ...e, action: actionOf(e) })).sort(by('createdAt')),
    progress: docs(progress).sort(by('updatedAt')),
    reservations: docs(reservations).map((r) => ({ ...r, status: normalizeStatus(r.status) })).sort(by('createdAt')),
    rewards: docs(rewards).sort(by('updatedAt')),
  };
}

// ---------- roles ----------
export async function listRoles() {
  const snap = await coll('roles').get();
  const stored = docs(snap).filter((r) => !roleFromConfig(r.id));
  // Staff fixed in config/access.json are shown too (read-only), so the tech admin
  // sees who already has access and does not try to add them again.
  return [...configuredStaff(), ...stored.map((r) => ({ ...r, active: ASSIGNABLE_ROLES.includes(r.role) }))];
}

export async function assignRole(actor, body) {
  const email = cleanEmail(str(body.email, { max: 120, required: true, field: 'email' }));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'bad_email');
  const role = oneOf(body.role, ASSIGNABLE_ROLES, 'role');
  if (!canAssignRole(actor.role, actor.email, email, role)) fail(403, 'cannot_assign_role', { reason: roleBlockReason(actor.email, email) });
  const ref = coll('roles').doc(email);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const before = snap.exists ? snap.data() : null;
    if (role === 'student') tx.delete(ref);
    else tx.set(ref, { email, role, assignedBy: actor.uid, assignedByEmail: actor.email, assignedAt: new Date().toISOString() });
    audit(tx, actor, role === 'student' ? 'role_removed' : 'role_assigned', 'roles', email, before ? { role: before.role } : null, { role });
  });
  return { email, role };
}

// ---------- settings ----------
export async function getSettings() {
  const [school, rules, mail] = await Promise.all([getSchool(), getRules(), mailStatus()]);
  return { school, rules, mail };
}

async function saveSettingsDoc(actor, name, before, after) {
  await db().runTransaction(async (tx) => {
    const now = new Date().toISOString();
    tx.set(coll('settings').doc(name), { ...after, updatedAt: now, updatedBy: actor.uid });
    tx.set(coll('settings_history').doc(), { name, before, after, by: actor.uid, byEmail: actor.email, at: now });
    audit(tx, actor, `settings_${name}_updated`, 'settings', name, before, after);
  });
}

export async function saveSchool(actor, body) {
  const before = await getSchool();
  const next = normalizeSchool({ ...before, ...body });
  if (body.currentAcademicYear && !isAcademicYear(body.currentAcademicYear)) fail(400, 'bad_academic_year');
  await saveSettingsDoc(actor, 'school', before, next);
  return next;
}

export async function saveRules(actor, body) {
  const before = await getRules();
  const next = normalizeRules({ ...before, ...body });
  await saveSettingsDoc(actor, 'points', before, next);
  return next;
}

export async function settingsHistory() {
  const snap = await coll('settings_history').orderBy('at', 'desc').limit(50).get();
  return docs(snap);
}

// ---------- audit ----------
export async function auditLog(query = {}) {
  const max = Math.min(500, Number(query.limit) || 200);
  const snap = await coll('admin_audit_logs').orderBy('createdAt', 'desc').limit(max).get();
  return docs(snap).filter((r) => !query.action || String(r.action).startsWith(query.action));
}

// ---------- reports (no personal data) ----------
export async function reports() {
  const school = await getSchool();
  const year = school.currentAcademicYear;
  const [profiles, progress, reservations, shanyraks, classMap, reviews] = await Promise.all([
    coll('profiles').where('academicYear', '==', year).get(),
    coll('reading_progress').get(),
    coll('reservations').get(),
    coll('shanyrak_points').where('academicYear', '==', year).get(),
    coll('class_map').where('academicYear', '==', year).get(),
    coll('reviews').where('status', '==', 'pending').get(),
  ]);
  const months = {};
  const bump = (m, k) => {
    if (!m) return;
    months[m] = months[m] || { confirmed: 0, requests: 0, reservations: 0, issued: 0 };
    months[m][k] += 1;
  };
  const readers = new Set();
  const confirmedByUid = new Map();
  const topBooks = new Map();
  let pending = 0;
  for (const d of progress.docs) {
    const p = d.data();
    if (p.verificationStatus === 'pending') pending += 1;
    if (p.requestedAt) bump(periodKeys(p.requestedAt).month, 'requests');
    if (p.verificationStatus === 'confirmed' && p.verifiedAt && periodKeys(p.verifiedAt).academicYear === year) {
      bump(periodKeys(p.verifiedAt).month, 'confirmed');
      confirmedByUid.set(p.uid, (confirmedByUid.get(p.uid) || 0) + 1);
      const key = p.bookTitle || p.bookId;
      topBooks.set(key, (topBooks.get(key) || 0) + 1);
    }
    if (p.updatedAt && periodKeys(p.updatedAt).academicYear === year) readers.add(p.uid);
  }
  const res = { open: 0, ready: 0, issued: 0, overdue: 0 };
  const now = Date.now();
  for (const d of reservations.docs) {
    const r = d.data();
    const st = normalizeStatus(r.status);
    const created = r.createdAt || r.reservedAt;
    if (created && periodKeys(created).academicYear === year) bump(periodKeys(created).month, 'reservations');
    if (r.issuedAt && periodKeys(r.issuedAt).academicYear === year) bump(periodKeys(r.issuedAt).month, 'issued');
    if (st === 'requested') res.open += 1;
    if (st === 'ready') res.ready += 1;
    if (st === 'issued') {
      res.issued += 1;
      if (r.dueDate && new Date(r.dueDate).getTime() < now) res.overdue += 1;
    }
  }
  const studentsByClass = {};
  const activeByClass = {};
  for (const d of profiles.docs) {
    const p = d.data();
    if (!p.className) continue;
    studentsByClass[p.className] = (studentsByClass[p.className] || 0) + 1;
    if (confirmedByUid.has(d.id)) activeByClass[p.className] = (activeByClass[p.className] || 0) + 1;
  }
  return {
    academicYear: year,
    totals: {
      students: profiles.size,
      readers: readers.size,
      confirmedBooks: [...confirmedByUid.values()].reduce((s, n) => s + n, 0),
      pendingVerifications: pending,
      pendingReviews: reviews.size,
      ...res,
    },
    months: Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    shanyraks: docs(shanyraks).map((s) => ({ name: s.name, total: Number(s.total) || 0 })).sort((a, b) => b.total - a.total),
    classes: docs(classMap).filter((c) => c.active !== false).map((c) => ({
      className: c.className,
      shanyrakName: c.shanyrakName || '',
      students: studentsByClass[c.className] || 0,
      activeReaders: activeByClass[c.className] || 0,
    })),
    topBooks: [...topBooks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([title, count]) => ({ title, count })),
  };
}

// ---------- migration from the previous version ----------
// Additive only: old fields are never deleted. Every document changed by a run is
// first copied to migration_backups/{runId}__{path}; rollback restores them and
// deletes the documents the run created.
export async function migrate(actor, body) {
  const dryRun = body.dryRun !== false && !bool(body.apply);
  const runId = `m1_${Date.now()}`;
  const school = await getSchool();
  const plan = { reservations: [], ledger: [], legacyRoles: [] };

  const [resSnap, ledgerSnap, rolesSnap] = await Promise.all([coll('reservations').get(), coll('points_ledger').get(), coll('roles').get()]);
  for (const d of resSnap.docs) {
    const r = d.data();
    const needs = r.status === 'active' || !r.bookTitle || !r.code || r.holding === undefined;
    if (needs) plan.reservations.push(d);
  }
  for (const d of ledgerSnap.docs) {
    const e = d.data();
    if (!e.action || !e.month || e.reversed === undefined) plan.ledger.push(d);
  }
  for (const d of rolesSnap.docs) if (!ASSIGNABLE_ROLES.includes(d.data().role)) plan.legacyRoles.push({ email: d.id, role: d.data().role });

  const summary = {
    runId: dryRun ? null : runId,
    dryRun,
    reservations: plan.reservations.length,
    legacyActiveReservations: plan.reservations.filter((d) => d.data().status === 'active').length,
    ledgerEntries: plan.ledger.length,
    legacyRolesIgnored: plan.legacyRoles,
  };
  if (dryRun) return { ...summary, aggregates: await rebuildAggregates(actor, { dryRun: true }) };

  const created = [];
  const backup = async (d) => coll('migration_backups').doc(`${runId}__${d.ref.path.replace(/\//g, '__')}`).set({ runId, path: d.ref.path, data: d.data(), at: new Date().toISOString() });

  // Ledger: add `action`, period keys and `reversed` flag.
  for (const d of plan.ledger) {
    await backup(d);
    const e = d.data();
    await d.ref.update({ action: actionOf(e), ...(e.month ? {} : periodKeys(e.createdAt)), reversed: e.reversed === true });
  }

  // Reservations: fill new fields; old «active» requests become «requested» and
  // take a hold if a copy is free (otherwise they wait without a hold).
  let holds = 0;
  for (const d of plan.reservations) {
    await backup(d);
    const outcome = await db().runTransaction(async (tx) => {
      const snap = await tx.get(d.ref);
      const r = snap.data();
      const status = normalizeStatus(r.status);
      const patch = {
        bookTitle: r.bookTitle || r.title || '',
        bookAuthor: r.bookAuthor || r.author || '',
        code: r.code || reservationCode(),
        createdAt: r.createdAt || r.reservedAt || new Date().toISOString(),
        notification: r.notification || { status: 'not_sent', attempts: 0 },
        history: r.history || [{ status, at: r.reservedAt || r.createdAt || new Date().toISOString(), by: r.uid || '', role: 'student', note: 'migrated' }],
        migratedBy: runId,
      };
      let tookHold = false;
      const lockPath = r.uid && r.bookId ? `reservation_locks/${r.uid}__${r.bookId}` : '';
      let lockExists = true;
      if (lockPath && ['requested', 'issued'].includes(status)) lockExists = (await tx.get(db().doc(lockPath))).exists;
      if (r.status === 'active') {
        patch.status = 'requested';
        patch.holding = false;
        if (r.bookId && catalogBook(r.bookId)) {
          const invRef = coll('inventory').doc(r.bookId);
          const invSnap = await tx.get(invRef);
          let inv = invSnap.exists ? invSnap.data() : null;
          if (!inv) {
            const book = catalogBook(r.bookId);
            const legacy = await tx.get(coll('book_stock').doc(r.bookId));
            const issued = legacy.exists ? Number(legacy.data().issued) || 0 : 0;
            inv = { bookId: r.bookId, title: book.title, author: book.author, total: Math.max(book.copies, issued), held: 0, issued, source: 'catalog' };
          }
          if (availability(inv).available > 0) {
            const next = applyDelta(inv, { held: 1 });
            tx.set(invRef, { ...inv, ...next, updatedAt: new Date().toISOString() });
            tx.set(coll('inventory_log').doc(), { bookId: r.bookId, bookTitle: inv.title || '', action: 'hold', delta: { held: 1 }, after: next, reservationId: d.id, reason: 'migration', by: 'system', byRole: 'system', at: new Date().toISOString() });
            patch.holding = true;
            patch.holdUntil = addHours(new Date(), school.holdHours).toISOString();
            tookHold = true;
            if (!invSnap.exists) created.push(`inventory/${r.bookId}`);
          }
        }
      } else if (r.holding === undefined) {
        patch.holding = false;
      }
      if (lockPath && !lockExists) {
        tx.set(db().doc(lockPath), { reservationId: d.id, uid: r.uid, bookId: r.bookId, createdAt: new Date().toISOString() });
        created.push(lockPath);
      }
      tx.update(d.ref, patch);
      return tookHold;
    });
    if (outcome) holds += 1;
  }

  const aggregates = await rebuildAggregates(actor, { dryRun: false });
  await coll('migration_runs').doc(runId).set({ runId, by: actor.uid, at: new Date().toISOString(), summary: { ...summary, holds }, created });
  await audit(null, actor, 'migration_applied', 'migration_runs', runId, null, { ...summary, holds });
  return { ...summary, holds, aggregates, created: created.length };
}

export async function rollbackMigration(actor, body) {
  const runId = idParam(body.runId, 'runId');
  const run = await coll('migration_runs').doc(runId).get();
  if (!run.exists) fail(404, 'run_not_found');
  const backups = await coll('migration_backups').where('runId', '==', runId).get();
  let restored = 0;
  for (const b of backups.docs) {
    await db().doc(b.get('path')).set(b.get('data'));
    restored += 1;
  }
  let deleted = 0;
  for (const path of run.get('created') || []) {
    if (path.startsWith('reservation_locks/') || path.startsWith('inventory/')) {
      await db().doc(path).delete();
      deleted += 1;
    }
  }
  await rebuildAggregates(actor, { dryRun: false });
  await run.ref.update({ rolledBackAt: new Date().toISOString(), rolledBackBy: actor.uid });
  await audit(null, actor, 'migration_rolled_back', 'migration_runs', runId, null, { restored, deleted });
  return { runId, restored, deleted };
}
