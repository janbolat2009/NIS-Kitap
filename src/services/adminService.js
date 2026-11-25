// Staff operations. Every write here is also checked by firestore.rules, and
// every change is recorded in admin_audit_logs in the same batch/transaction.
import {
  collection, doc, getDoc, getDocs, setDoc, query, where, writeBatch, runTransaction, serverTimestamp, increment, limit, orderBy,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { session } from '@/stores/session';
import {
  entriesForConfirmation, milestoneEntries, onlyNewEntries, summarizeLedger, normalizeSettings,
  shortPublicName, ledgerId, periodKeys, suspiciousFlags,
} from '@/lib/points';
import { cleanEmail } from '@/lib/roles';

const auditRef = () => doc(collection(db, 'admin_audit_logs'));

function auditData(action, entityType, entityId, before = null, after = null) {
  return {
    actorUid: session.uid,
    actorEmail: session.email,
    actorRole: session.role,
    action,
    entityType,
    entityId: String(entityId || ''),
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    createdAt: serverTimestamp(),
  };
}

function eventData(type, progressOrRes, extra = {}) {
  return {
    uid: progressOrRes.uid,
    actorUid: session.uid,
    type,
    source: 'admin',
    bookId: progressOrRes.bookId || '',
    bookTitle: progressOrRes.bookTitle || progressOrRes.title || '',
    bookAuthor: progressOrRes.bookAuthor || progressOrRes.author || '',
    language: progressOrRes.language || '',
    genre: progressOrRes.genre || '',
    isHundred: Boolean(progressOrRes.isHundred),
    occurredAt: serverTimestamp(),
    metadata: extra,
  };
}

const all = async (ref) => (await getDocs(ref)).docs.map((d) => ({ id: d.id, ...d.data() }));

// ---------- settings ----------
export async function getPointSettings() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'points'));
    return normalizeSettings(snap.exists() ? snap.data() : {});
  } catch {
    return normalizeSettings({});
  }
}

export async function savePointSettings(next) {
  const before = await getPointSettings();
  const after = normalizeSettings(next);
  const batch = writeBatch(db);
  batch.set(doc(db, 'settings', 'points'), { ...after, updatedBy: session.uid, updatedAt: new Date().toISOString() });
  batch.set(auditRef(), auditData('points_settings_update', 'settings', 'points', before, after));
  await batch.commit();
  return after;
}

// ---------- verification queue ----------
export async function listVerificationQueue() {
  const pending = await all(query(collection(db, 'reading_progress'), where('verificationStatus', '==', 'pending')));
  const byUid = new Map();
  for (const p of pending) byUid.set(p.uid, [...(byUid.get(p.uid) || []), p]);

  // Evidence: returned loans for the same book.
  let returned = [];
  try {
    returned = await all(query(collection(db, 'reservations'), where('status', '==', 'returned')));
  } catch {
    returned = [];
  }
  const settings = await getPointSettings();
  return pending
    .map((p) => {
      const history = byUid.get(p.uid) || [];
      const loanReturned = returned.some((r) => r.uid === p.uid && r.bookId === p.bookId);
      return { ...p, loanReturned, flags: suspiciousFlags({ ...p, loanReturned }, history, settings) };
    })
    .sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
}

/**
 * Confirms a reading. Runs in a transaction: if two librarians press the button
 * at the same time, only one confirmation (and one set of points) is recorded.
 */
export async function confirmReading(progressId, { reviewAccepted = false, note = '', method = '' } = {}) {
  const settings = await getPointSettings();
  const progressRef = doc(db, 'reading_progress', progressId);
  const first = await getDoc(progressRef);
  if (!first.exists()) throw new Error('not_found');
  const uid = first.data().uid;

  const ledger = await all(query(collection(db, 'points_ledger'), where('uid', '==', uid)));
  const existingIds = new Set(ledger.map((e) => e.id));
  const confirmedBefore = await all(query(collection(db, 'reading_progress'), where('uid', '==', uid), where('verificationStatus', '==', 'confirmed')));

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    if (!snap.exists()) throw new Error('not_found');
    const progress = { id: snap.id, ...snap.data() };
    if (progress.verificationStatus !== 'pending') throw new Error('already_decided');

    const now = new Date();
    const entries = onlyNewEntries(
      entriesForConfirmation(progress, {
        settings,
        actorUid: session.uid,
        now,
        reviewAccepted,
        alreadyConfirmedBookIds: confirmedBefore.map((p) => p.bookId),
      }),
      existingIds,
    );
    const badges = milestoneEntries(uid, confirmedBefore.length + 1, existingIds, { settings, actorUid: session.uid, now });
    const after = {
      ...progress,
      verificationStatus: 'confirmed',
      verifiedBy: session.uid,
      verifiedAt: now.toISOString(),
      reviewAccepted: Boolean(reviewAccepted),
      decisionNote: String(note || '').slice(0, 500),
      method: method || progress.method || 'manual',
    };
    delete after.id;
    tx.set(progressRef, after);
    for (const entry of [...entries, ...badges]) {
      const { id, ...data } = entry;
      tx.set(doc(db, 'points_ledger', id), data);
    }
    tx.set(doc(collection(db, 'reading_events')), eventData('confirmed', progress, { method: after.method }));
    tx.set(auditRef(), auditData('reading_confirmed', 'reading_progress', progressId, progress, after));
    return { uid, points: entries.reduce((s, e) => s + e.points, 0), badges: badges.map((b) => b.badge) };
  });
  await rebuildLeaderboardRow(uid);
  return result;
}

export async function rejectReading(progressId, note = '') {
  const progressRef = doc(db, 'reading_progress', progressId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    if (!snap.exists()) throw new Error('not_found');
    const progress = { id: snap.id, ...snap.data() };
    if (progress.verificationStatus !== 'pending') throw new Error('already_decided');
    const after = {
      ...progress,
      verificationStatus: 'rejected',
      verifiedBy: session.uid,
      verifiedAt: new Date().toISOString(),
      decisionNote: String(note || '').slice(0, 500),
    };
    delete after.id;
    tx.set(progressRef, after);
    tx.set(doc(collection(db, 'reading_events')), eventData('rejected', progress, {}));
    tx.set(auditRef(), auditData('reading_rejected', 'reading_progress', progressId, progress, after));
  });
}

// Librarian confirms a book without a student request (e.g. checked in person).
export async function manualConfirm(student, book, note = '') {
  if (!student?.uid) throw new Error('student_not_signed_up');
  const bookId = book.bookId;
  const id = `${student.uid}__${bookId}`;
  const ref = doc(db, 'reading_progress', id);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().verificationStatus === 'confirmed') throw new Error('already_decided');
  const now = new Date().toISOString();
  const pending = {
    uid: student.uid,
    email: cleanEmail(student.email),
    bookId,
    bookTitle: book.title,
    bookAuthor: book.author || '',
    language: book.language || '',
    genre: Array.isArray(book.genre) ? book.genre[0] || '' : book.genre || '',
    isHundred: Boolean(book.isHundred),
    hundredId: book.hundredId || '',
    status: 'finished',
    verificationStatus: 'confirmed',
    verifiedBy: session.uid,
    verifiedAt: now,
    method: 'manual',
    decisionNote: String(note || '').slice(0, 500),
    requestedAt: now,
    updatedAt: now,
    createdAt: now,
  };
  if (existing.exists()) throw new Error('use_queue'); // a record exists: decide it in the queue instead
  // Created as confirmed by staff; points are written right after in the same way as the queue.
  const settings = await getPointSettings();
  const ledger = await all(query(collection(db, 'points_ledger'), where('uid', '==', student.uid)));
  const existingIds = new Set(ledger.map((e) => e.id));
  const confirmedBefore = await all(query(collection(db, 'reading_progress'), where('uid', '==', student.uid), where('verificationStatus', '==', 'confirmed')));
  const entries = onlyNewEntries(entriesForConfirmation({ ...pending, id }, { settings, actorUid: session.uid, alreadyConfirmedBookIds: confirmedBefore.map((p) => p.bookId) }), existingIds);
  const badges = milestoneEntries(student.uid, confirmedBefore.length + 1, existingIds, { settings, actorUid: session.uid });
  const batch = writeBatch(db);
  batch.set(ref, pending);
  for (const entry of [...entries, ...badges]) {
    const { id: entryId, ...data } = entry;
    batch.set(doc(db, 'points_ledger', entryId), data);
  }
  batch.set(doc(collection(db, 'reading_events')), eventData('confirmed', pending, { method: 'manual' }));
  batch.set(auditRef(), auditData('reading_confirmed_manual', 'reading_progress', id, null, pending));
  await batch.commit();
  await rebuildLeaderboardRow(student.uid);
}

// ---------- manual point adjustments ----------
export async function adjustPoints(uid, points, reason) {
  const value = Math.round(Number(points));
  if (!uid || !Number.isFinite(value) || value === 0) throw new Error('bad_points');
  if (String(reason || '').trim().length < 5) throw new Error('reason_required');
  const ref = doc(collection(db, 'points_ledger'));
  const now = new Date();
  const entry = {
    uid,
    kind: 'manual',
    points: value,
    reason: String(reason).trim().slice(0, 300),
    sourceType: 'manual',
    sourceId: ref.id,
    createdBy: session.uid,
    createdAt: now.toISOString(),
    ...periodKeys(now),
  };
  const batch = writeBatch(db);
  batch.set(ref, entry);
  batch.set(auditRef(), auditData('points_manual_adjustment', 'points_ledger', ref.id, null, entry));
  await batch.commit();
  await rebuildLeaderboardRow(uid);
}

// ---------- leaderboard ----------
function fallbackShortName(displayName) {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.` : parts[0];
}

export async function rebuildLeaderboardRow(uid) {
  const ledger = await all(query(collection(db, 'points_ledger'), where('uid', '==', uid)));
  const summary = summarizeLedger(ledger);
  const userSnap = await getDoc(doc(db, 'users', uid));
  const user = userSnap.exists() ? userSnap.data() : {};
  const email = cleanEmail(user.email);
  const studentSnap = email ? await getDoc(doc(db, 'students', email)) : null;
  const student = studentSnap?.exists() ? studentSnap.data() : {};
  const privacyMode = user.privacyMode === 'hidden' ? 'hidden' : 'short';
  const nameShort = privacyMode === 'hidden' ? '' : student.shortName || fallbackShortName(user.name);
  const row = {
    uid,
    nameShort,
    privacyMode,
    className: student.className || '',
    grade: student.grade || null,
    classId: student.classId || '',
    shanyrakId: student.shanyrakId || '',
    shanyrakName: student.shanyrakName || '',
    academicYear: student.academicYear || '',
    points: summary.total,
    byPeriod: summary.byPeriod,
    confirmedBooks: summary.confirmedBooks,
    hundredBooks: summary.hundredBooks,
    badges: summary.badges,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'leaderboard', uid), row);
  return row;
}

// ---------- loans ----------
export async function listReservations() {
  const rows = await all(collection(db, 'reservations'));
  return rows.sort((a, b) => String(b.reservedAt || b.createdAt).localeCompare(String(a.reservedAt || a.createdAt)));
}

export async function setLoanStatus(reservation, status) {
  if (!['issued', 'returned', 'cancelled'].includes(status)) throw new Error('bad_status');
  const ref = doc(db, 'reservations', reservation.id);
  const before = { ...reservation };
  const now = new Date().toISOString();
  const after = { ...reservation, status, updatedAt: now, [`${status}At`]: now, [`${status}By`]: session.uid };
  delete after.id;
  const batch = writeBatch(db);
  batch.set(ref, after);
  if (reservation.bookId) {
    const stockRef = doc(db, 'book_stock', reservation.bookId);
    if (status === 'issued' && before.status !== 'issued') {
      batch.set(stockRef, { issued: increment(1), bookId: reservation.bookId, updatedAt: now }, { merge: true });
    }
    if (status === 'returned' && before.status === 'issued') {
      batch.set(stockRef, { issued: increment(-1), bookId: reservation.bookId, updatedAt: now }, { merge: true });
    }
  }
  if (status === 'issued' || status === 'returned') {
    batch.set(doc(collection(db, 'reading_events')), eventData(status === 'issued' ? 'issue' : 'return', reservation, { reservationId: reservation.id }));
  }
  batch.set(auditRef(), auditData(`loan_${status}`, 'reservations', reservation.id, before, after));
  await batch.commit();
}

// ---------- roster ----------
async function commitInChunks(ops) {
  // Firestore batches are limited to 500 writes.
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(batch));
    await batch.commit();
  }
}

export async function importShanyraks(parsed, fileName = '') {
  const years = new Set(parsed.classes.map((c) => c.academicYear));
  const ops = [];
  for (const year of years) ops.push((b) => b.set(doc(db, 'academic_years', year), { id: year, updatedAt: new Date().toISOString() }, { merge: true }));
  for (const s of parsed.shanyraks) ops.push((b) => b.set(doc(db, 'shanyraks', s.id), { ...s, updatedAt: new Date().toISOString() }));
  for (const c of parsed.classes) ops.push((b) => b.set(doc(db, 'classes', c.id), { ...c, updatedAt: new Date().toISOString() }));
  ops.push((b) => b.set(auditRef(), auditData('roster_import_shanyraks', 'shanyraks', fileName || 'import', null, {
    shanyraks: parsed.shanyraks.length, classes: parsed.classes.length, years: [...years],
  })));
  await commitInChunks(ops);
}

export async function importStudents(parsed, fileName = '') {
  const ops = [];
  const now = new Date().toISOString();
  for (const s of parsed.students) {
    const record = { ...s, shortName: shortPublicName(s.fullName), updatedAt: now };
    ops.push((b) => b.set(doc(db, 'students', s.email), record));
    ops.push((b) => b.set(doc(db, 'memberships', `${s.email}__${s.academicYear}`), {
      email: s.email, classId: s.classId, className: s.className, shanyrakId: s.shanyrakId, academicYear: s.academicYear, importedAt: now,
    }));
  }
  ops.push((b) => b.set(auditRef(), auditData('roster_import_students', 'students', fileName || 'import', null, { students: parsed.students.length })));
  await commitInChunks(ops);
}

export const listClasses = () => all(collection(db, 'classes'));
export const listShanyraks = () => all(collection(db, 'shanyraks'));
export const listStudents = () => all(collection(db, 'students'));
export const listUsers = () => all(collection(db, 'users'));

// ---------- roles ----------
export const listRoleAssignments = () => all(collection(db, 'roles'));

export async function assignRole(email, role, subject = '') {
  const target = cleanEmail(email);
  if (target === session.email) throw new Error('cannot_change_own_role');
  const ref = doc(db, 'roles', target);
  const beforeSnap = await getDoc(ref);
  const after = { email: target, role, subject: role === 'teacher' ? subject : '', assignedBy: session.uid, assignedAt: new Date().toISOString() };
  const batch = writeBatch(db);
  batch.set(ref, after);
  batch.set(auditRef(), auditData('role_assigned', 'roles', target, beforeSnap.exists() ? beforeSnap.data() : null, after));
  await batch.commit();
}

export async function removeRole(email) {
  const target = cleanEmail(email);
  if (target === session.email) throw new Error('cannot_change_own_role');
  const ref = doc(db, 'roles', target);
  const beforeSnap = await getDoc(ref);
  const batch = writeBatch(db);
  batch.delete(ref);
  batch.set(auditRef(), auditData('role_removed', 'roles', target, beforeSnap.exists() ? beforeSnap.data() : null, null));
  await batch.commit();
}

// ---------- audit ----------
export async function listAuditLog(max = 200) {
  return all(query(collection(db, 'admin_audit_logs'), orderBy('createdAt', 'desc'), limit(max)));
}

export async function writeAudit(action, entityType, entityId, before, after) {
  await setDoc(auditRef(), auditData(action, entityType, entityId, before, after));
}

// ---------- analytics ----------
export async function loadAnalyticsData() {
  const [events, progress, reservations, students, users, leaderboard] = await Promise.all([
    all(collection(db, 'reading_events')),
    all(collection(db, 'reading_progress')),
    all(collection(db, 'reservations')).catch(() => []),
    all(collection(db, 'students')).catch(() => []),
    all(collection(db, 'users')).catch(() => []),
    all(collection(db, 'leaderboard')).catch(() => []),
  ]);
  // Link roster rows (by email) to Firebase uids (by the users collection).
  const uidByEmail = new Map(users.filter((u) => u.email).map((u) => [cleanEmail(u.email), u.id]));
  const linkedStudents = students.map((s) => ({ ...s, uid: uidByEmail.get(cleanEmail(s.email)) || '' }));
  return { events, progress, reservations, students: linkedStudents, users, leaderboard };
}

export { ledgerId };
