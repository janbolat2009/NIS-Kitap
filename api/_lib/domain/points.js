// Points ledger on the server. Only this module writes points_ledger and the
// aggregates derived from it:
//   student_points/{uid}         total, per-year totals, counters, badges
//   shanyrak_points/{shanyrakId}  per-month totals by kind and by class (public)
//   leaderboard/{uid}             short public row (verified users only)
// Aggregates are updated with atomic increments in the same transaction as the
// ledger entry, so they can always be rebuilt from the ledger (rebuildAggregates).
import { db, FieldValue } from '../admin.js';
import { fail, str, int, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';
import { getSchool, getRules } from '../settings.js';
import {
  aggregateKey, actionOf, reversalEntry, periodKeys,
} from '../../../src/lib/points.js';

const coll = (name) => db().collection(name);

// Class/shanyrak snapshot used for new entries: the profile of the current year.
export function snapshotOf(profile, school) {
  const current = profile && profile.academicYear === school.currentAcademicYear;
  return {
    academicYear: school.currentAcademicYear,
    classId: current ? profile.classId || '' : '',
    className: current ? profile.className || '' : '',
    shanyrakId: current ? profile.shanyrakId || '' : '',
    shanyrakName: current ? profile.shanyrakName || '' : '',
  };
}

function inc(n) {
  return FieldValue.increment(n);
}

// Folds entries into one set of increments per aggregate document.
function accumulate(entries) {
  const student = { total: 0, years: {}, confirmedBooks: 0, hundredBooks: 0, badges: [] };
  const shanyraks = new Map();
  const lbYears = {};
  for (const e of entries) {
    const pts = Number(e.points) || 0;
    const kind = aggregateKey(e);
    const year = e.academicYear || '';
    const action = actionOf(e);
    const target = action === 'reversal' ? e.reversedAction : action;
    const sign = action === 'reversal' ? -1 : 1;
    const bookDelta = target === 'book_confirmed' ? sign : 0;
    const hundredDelta = target === 'hundred_bonus' ? sign : 0;

    student.total += pts;
    student.confirmedBooks += bookDelta;
    student.hundredBooks += hundredDelta;
    if (action === 'milestone' && e.badge) student.badges.push(e.badge);
    if (year) {
      const y = student.years[year] || { total: 0 };
      y.total += pts;
      y[kind] = (y[kind] || 0) + pts;
      if (bookDelta) y.books = (y.books || 0) + bookDelta;
      student.years[year] = y;
      const l = lbYears[year] || { points: 0, books: 0 };
      l.points += pts;
      l.books += bookDelta;
      lbYears[year] = l;
    }
    if (e.shanyrakId) {
      const s = shanyraks.get(e.shanyrakId) || { name: e.shanyrakName, academicYear: year, total: 0, months: {} };
      s.total += pts;
      const m = s.months[e.month] || { total: 0, classes: {} };
      m.total += pts;
      m[kind] = (m[kind] || 0) + pts;
      if (e.className) m.classes[e.className] = (m.classes[e.className] || 0) + pts;
      if (bookDelta) m.books = (m.books || 0) + bookDelta;
      s.months[e.month] = m;
      shanyraks.set(e.shanyrakId, s);
    }
  }
  return { student, shanyraks, lbYears };
}

function incrementTree(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v && typeof v === 'object' ? incrementTree(v) : inc(Number(v) || 0);
  }
  return out;
}

/**
 * Writes ledger entries and their aggregates inside a transaction.
 * All reads (existence of the entry ids, the profile) must be done by the caller
 * before calling this function.
 */
export function writeEntries(tx, entries, profile) {
  if (!entries.length) return;
  const uid = entries[0].uid;
  const now = new Date().toISOString();
  for (const e of entries) {
    const { id: entryId, ...data } = e;
    tx.create(coll('points_ledger').doc(entryId), data);
  }
  const { student, shanyraks, lbYears } = accumulate(entries);
  const studentDoc = {
    uid,
    total: inc(student.total),
    confirmedBooks: inc(student.confirmedBooks),
    hundredBooks: inc(student.hundredBooks),
    years: incrementTree(student.years),
    updatedAt: now,
  };
  if (student.badges.length) studentDoc.badges = FieldValue.arrayUnion(...student.badges);
  tx.set(coll('student_points').doc(uid), studentDoc, { merge: true });

  for (const [shanyrakId, s] of shanyraks) {
    tx.set(coll('shanyrak_points').doc(shanyrakId), {
      shanyrakId,
      name: s.name,
      academicYear: s.academicYear,
      total: inc(s.total),
      months: incrementTree(s.months),
      updatedAt: now,
    }, { merge: true });
  }

  const lb = {
    uid,
    years: incrementTree(lbYears),
    updatedAt: now,
  };
  if (profile) {
    lb.nameShort = profile.privacyMode === 'hidden' ? '' : profile.shortName || '';
    lb.privacyMode = profile.privacyMode === 'hidden' ? 'hidden' : 'short';
    lb.className = profile.className || '';
    lb.shanyrakName = profile.shanyrakName || '';
  }
  tx.set(coll('leaderboard').doc(uid), lb, { merge: true });
}

// Returns only the entries whose ids do not exist yet (idempotency).
export async function onlyNew(tx, entries) {
  const snaps = await Promise.all(entries.map((e) => tx.get(coll('points_ledger').doc(e.id))));
  return entries.filter((_, i) => !snaps[i].exists);
}

// ---------- manual adjustment ----------
export async function manualAdjust(actor, body) {
  const uid = idParam(body.uid, 'uid');
  assertNotSelf(actor, uid);
  const reason = str(body.reason, { min: 5, max: 300, required: true, field: 'reason' });
  const [school, rules] = await Promise.all([getSchool(), getRules()]);
  const points = int(body.points, { min: -rules.maxManualPoints, max: rules.maxManualPoints, field: 'points' });
  if (points === 0) fail(400, 'bad_number', { field: 'points' });
  const ref = coll('points_ledger').doc();
  const entryId = `manual__${ref.id}`;
  const now = new Date();
  return db().runTransaction(async (tx) => {
    const pSnap = await tx.get(coll('profiles').doc(uid));
    if (!pSnap.exists) fail(404, 'student_not_found');
    const profile = pSnap.data();
    const entry = {
      id: entryId,
      uid,
      action: 'manual',
      points,
      reason,
      sourceType: 'manual',
      sourceId: entryId,
      bookId: '',
      bookTitle: '',
      createdAt: now.toISOString(),
      createdBy: actor.uid,
      createdByRole: actor.role,
      ...periodKeys(now),
      ...snapshotOf(profile, school),
      reversed: false,
    };
    writeEntries(tx, [entry], profile);
    audit(tx, actor, 'points_manual_adjustment', 'points_ledger', entryId, null, { uid, points, reason });
    return entry;
  });
}

// ---------- reversal ----------
// Cancels one entry (manual, reward, review bonus …) with an opposite entry.
export async function reverseEntry(actor, entryId, body, { tx: outerTx } = {}) {
  const reason = str(body.reason, { min: 5, max: 300, required: true, field: 'reason' });
  const run = async (tx) => {
    const ref = coll('points_ledger').doc(idParam(entryId, 'entryId'));
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'entry_not_found');
    const original = { id: snap.id, ...snap.data() };
    assertNotSelf(actor, original.uid);
    if (actionOf(original) === 'reversal') fail(409, 'cannot_reverse_reversal');
    if (original.reversed) fail(409, 'already_reversed');
    const rev = reversalEntry(original, { actor, reason });
    const revSnap = await tx.get(coll('points_ledger').doc(rev.id));
    if (revSnap.exists) fail(409, 'already_reversed');
    const pSnap = await tx.get(coll('profiles').doc(original.uid));
    const now = new Date().toISOString();
    writeEntries(tx, [rev], pSnap.exists ? pSnap.data() : null);
    tx.update(ref, { reversed: true, reversedAt: now, reversedBy: actor.uid, reversedByRole: actor.role, reversalId: rev.id, reversalReason: reason });
    audit(tx, actor, 'points_reversed', 'points_ledger', original.id, { points: original.points, action: actionOf(original) }, { reversal: rev.id }, reason);
    return rev;
  };
  return outerTx ? run(outerTx) : db().runTransaction(run);
}

// ---------- rebuild (maintenance) ----------
// Recomputes student_points, shanyrak_points and leaderboard from the ledger.
// Used by the migration and by the tech admin if aggregates ever look wrong.
export async function rebuildAggregates(actor, { dryRun = true } = {}) {
  const ledger = await coll('points_ledger').get();
  const entries = ledger.docs.map((d) => ({ id: d.id, ...d.data() }));
  const byUid = new Map();
  for (const e of entries) {
    if (!e.uid) continue;
    byUid.set(e.uid, [...(byUid.get(e.uid) || []), e]);
  }
  const shanyrakTotals = new Map();
  const studentDocs = [];
  for (const [uid, list] of byUid) {
    const normalized = list.map((e) => ({ ...e, ...(e.month ? {} : periodKeys(e.createdAt)) }));
    const { student, shanyraks, lbYears } = accumulate(normalized);
    studentDocs.push({ uid, student, lbYears });
    for (const [sid, s] of shanyraks) {
      const cur = shanyrakTotals.get(sid) || { name: s.name, academicYear: s.academicYear, total: 0, months: {} };
      cur.total += s.total;
      for (const [m, v] of Object.entries(s.months)) {
        const target = cur.months[m] || { total: 0, classes: {} };
        for (const [k, n] of Object.entries(v)) {
          if (k === 'classes') for (const [c, cn] of Object.entries(n)) target.classes[c] = (target.classes[c] || 0) + cn;
          else target[k] = (target[k] || 0) + n;
        }
        cur.months[m] = target;
      }
      shanyrakTotals.set(sid, cur);
    }
  }
  const summary = { ledgerEntries: entries.length, students: studentDocs.length, shanyraks: shanyrakTotals.size };
  if (dryRun) return { ...summary, applied: false };
  const now = new Date().toISOString();
  const ops = [];
  for (const { uid, student, lbYears } of studentDocs) {
    ops.push((b) => b.set(coll('student_points').doc(uid), {
      uid, total: student.total, confirmedBooks: student.confirmedBooks, hundredBooks: student.hundredBooks,
      years: student.years, badges: [...new Set(student.badges)], updatedAt: now,
    }));
    ops.push((b) => b.set(coll('leaderboard').doc(uid), { uid, years: lbYears, updatedAt: now }, { mergeFields: ['uid', 'years', 'updatedAt'] }));
  }
  for (const [sid, s] of shanyrakTotals) {
    ops.push((b) => b.set(coll('shanyrak_points').doc(sid), { shanyrakId: sid, ...s, updatedAt: now }));
  }
  ops.push((b) => audit(b, actor, 'points_aggregates_rebuilt', 'points_ledger', 'all', null, summary));
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db().batch();
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
  return { ...summary, applied: true };
}
