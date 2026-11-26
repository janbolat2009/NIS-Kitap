// Fund (inventory) and reservations. Every change of counters happens in a
// Firestore transaction together with the reservation it belongs to and a line
// in inventory_log, so two readers can never take the same last copy and a
// counter can never go below zero (applyDelta refuses it).
//
// inventory/{bookId}           total, held, issued (public: counts only)
// reservations/{id}            status, holdUntil, pickup, notification, history
// reservation_locks/{uid__bookId}  one open reservation per reader and book
// inventory_log/{auto}         every change of the counters, with who and why
import crypto from 'node:crypto';
import { db } from '../admin.js';
import { fail, str, int, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';
import { rateLimit } from '../rateLimit.js';
import { getSchool, localDateTime } from '../settings.js';
import { catalogBook } from '../catalog.js';
import {
  availability, applyDelta, normalizeStatus, canTransition, isHoldExpired, addHours, reservationCode, isValidPickup, HOLDING, OPEN,
} from '../../../src/lib/loans.js';

const coll = (name) => db().collection(name);
const SYSTEM = { uid: 'system', email: 'system', role: 'system' };

// ---------- inventory ----------
async function readInventory(tx, bookId) {
  const ref = coll('inventory').doc(bookId);
  const snap = await tx.get(ref);
  if (snap.exists) return { ref, data: snap.data(), exists: true };
  const book = catalogBook(bookId);
  if (!book) fail(404, 'unknown_book');
  // Copies the previous version recorded as issued (book_stock) stay issued.
  const legacy = await tx.get(coll('book_stock').doc(bookId));
  const issued = legacy.exists ? Math.max(0, Number(legacy.data().issued) || 0) : 0;
  return {
    ref,
    exists: false,
    data: { bookId, title: book.title, author: book.author, total: Math.max(book.copies, issued), held: 0, issued, source: 'catalog' },
  };
}

function writeInventory(tx, inv, next, log) {
  const now = new Date().toISOString();
  tx.set(inv.ref, {
    bookId: inv.data.bookId,
    title: inv.data.title || '',
    author: inv.data.author || '',
    source: inv.data.source || 'catalog',
    total: next.total,
    held: next.held,
    issued: next.issued,
    available: next.available,
    updatedAt: now,
  });
  tx.set(coll('inventory_log').doc(), {
    bookId: inv.data.bookId,
    bookTitle: inv.data.title || '',
    action: log.action,
    delta: log.delta || {},
    after: { total: next.total, held: next.held, issued: next.issued },
    reservationId: log.reservationId || '',
    reason: String(log.reason || '').slice(0, 300),
    by: log.actor?.uid || 'system',
    byRole: log.actor?.role || 'system',
    at: now,
  });
}

function change(inv, delta) {
  try {
    return applyDelta(inv.data, delta);
  } catch (err) {
    fail(409, err.code || 'no_copies', { availability: availability(inv.data) });
  }
  return null;
}

function historyItem(status, actor, note = '') {
  return { status, at: new Date().toISOString(), by: actor.uid, role: actor.role, note: String(note || '').slice(0, 300) };
}

function lockRef(uid, bookId) {
  return coll('reservation_locks').doc(`${uid}__${bookId}`);
}

function requestId(uid, key) {
  return `r_${crypto.createHash('sha256').update(`${uid}:${key}`).digest('hex').slice(0, 20)}`;
}

function publicReservation(r) {
  return { id: r.id, ...r };
}

// ---------- reader ----------
export async function createReservation(actor, body) {
  const bookId = idParam(str(body.bookId, { max: 60, required: true, field: 'bookId' }), 'bookId');
  const key = str(body.requestKey, { max: 64, field: 'requestKey' }) || crypto.randomUUID();
  const book = catalogBook(bookId);
  if (!book) fail(404, 'unknown_book');
  await rateLimit(`reserve_${actor.uid}`, { limit: 10, windowSec: 3600 });
  const school = await getSchool();
  await expireForBook(bookId);
  const resRef = coll('reservations').doc(requestId(actor.uid, key));
  const lRef = lockRef(actor.uid, bookId);

  return db().runTransaction(async (tx) => {
    const existing = await tx.get(resRef);
    if (existing.exists) return { ...publicReservation({ id: existing.id, ...existing.data() }), duplicate: true };
    const lock = await tx.get(lRef);
    if (lock.exists) {
      const other = await tx.get(coll('reservations').doc(lock.data().reservationId));
      if (other.exists && OPEN.includes(normalizeStatus(other.data().status))) {
        fail(409, 'already_reserved', { reservationId: other.id });
      }
    }
    const open = await tx.get(coll('reservations').where('uid', '==', actor.uid).where('status', 'in', ['requested', 'ready', 'active']));
    if (open.size >= school.maxOpenReservations) fail(409, 'too_many_reservations', { max: school.maxOpenReservations });
    const inv = await readInventory(tx, bookId);
    const pSnap = await tx.get(coll('profiles').doc(actor.uid));
    const profile = pSnap.exists ? pSnap.data() : {};
    const next = change(inv, { held: 1 });
    const now = new Date();
    const reservation = {
      code: reservationCode(),
      uid: actor.uid,
      userEmail: actor.email,
      userName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || actor.name || actor.email.split('@')[0],
      className: profile.className || '',
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      status: 'requested',
      holding: true,
      holdUntil: addHours(now, school.holdHours).toISOString(),
      requestKey: key,
      pickup: null,
      notification: { status: 'not_sent', attempts: 0 },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      history: [historyItem('requested', actor)],
    };
    tx.create(resRef, reservation);
    tx.set(lRef, { reservationId: resRef.id, uid: actor.uid, bookId, createdAt: now.toISOString() });
    writeInventory(tx, inv, next, { action: 'hold', delta: { held: 1 }, reservationId: resRef.id, actor });
    tx.set(coll('reading_events').doc(), {
      uid: actor.uid, actorUid: actor.uid, type: 'reservation', source: 'api', bookId, bookTitle: book.title, bookAuthor: book.author,
      language: book.language || '', genre: book.genre || '', isHundred: false, occurredAt: now.toISOString(), metadata: { reservationId: resRef.id },
    });
    return { id: resRef.id, ...reservation, availability: availability(next) };
  });
}

// ---------- transitions ----------
async function transition(actor, reservationId, to, { note = '', staff = false, patch = () => ({}), extraReads } = {}) {
  const ref = coll('reservations').doc(idParam(reservationId, 'reservationId'));
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const r = { id: snap.id, ...snap.data() };
    const from = normalizeStatus(r.status);
    if (!staff && r.uid !== actor.uid) fail(403, 'forbidden');
    if (staff) assertNotSelf(actor, r.uid);
    if (!canTransition(from, to)) fail(409, 'bad_transition', { from, to });
    const inv = await readInventory(tx, r.bookId);
    const extra = extraReads ? await extraReads(tx, r) : {};
    // Records from the previous version (status «active») never held a copy.
    const holding = r.holding === true;
    let delta = {};
    if (to === 'issued') delta = holding ? { held: -1, issued: 1 } : { issued: 1 };
    else if (to === 'returned') delta = { issued: -1 };
    else if (to === 'cancelled' || to === 'expired') delta = holding ? { held: -1 } : {};
    else if (to === 'ready' && !holding) delta = { held: 1 };
    const next = Object.keys(delta).length ? change(inv, delta) : null;
    const now = new Date().toISOString();
    const update = {
      status: to,
      updatedAt: now,
      history: [...(r.history || []).slice(-30), historyItem(to, actor, note)],
      ...(to === 'ready' || (to === 'issued') ? { holding: to === 'ready' } : {}),
      ...(['returned', 'cancelled', 'expired'].includes(to) ? { holding: false } : {}),
      ...patch(r, extra),
    };
    if (to === 'cancelled') Object.assign(update, { cancelledAt: now, cancelledBy: actor.uid, cancelledByRole: actor.role, cancelReason: String(note || '').slice(0, 300) });
    if (to === 'expired') update.expiredAt = now;
    tx.update(ref, update);
    if (next) writeInventory(tx, inv, next, { action: to === 'ready' ? 'hold' : to, delta, reservationId: ref.id, actor, reason: note });
    if (['returned', 'cancelled', 'expired'].includes(to)) {
      const lRef = lockRef(r.uid, r.bookId);
      const lock = extra.lock;
      if (!lock || lock.data()?.reservationId === ref.id) tx.delete(lRef);
    }
    if (staff) audit(tx, actor, `reservation_${to}`, 'reservations', ref.id, { status: from }, { status: to }, note);
    return { ...r, ...update, id: ref.id, availability: next ? availability(next) : availability(inv.data) };
  });
}

const lockRead = async (tx, r) => ({ lock: await tx.get(lockRef(r.uid, r.bookId)) });

export async function cancelMine(actor, reservationId) {
  const ref = coll('reservations').doc(idParam(reservationId, 'reservationId'));
  const snap = await ref.get();
  if (!snap.exists || snap.data().uid !== actor.uid) fail(404, 'not_found');
  if (!HOLDING.includes(normalizeStatus(snap.data().status))) fail(409, 'cannot_cancel');
  return transition(actor, reservationId, 'cancelled', { note: 'Отменено читателем', extraReads: lockRead });
}

export async function cancelByStaff(actor, reservationId, body) {
  const reason = str(body.reason, { min: 3, max: 300, required: true, field: 'reason' });
  return transition(actor, reservationId, 'cancelled', { note: reason, staff: true, extraReads: lockRead });
}

export async function prepare(actor, reservationId, body) {
  const pickup = {
    date: str(body.date, { max: 10, required: true, field: 'date' }),
    from: str(body.from, { max: 5, required: true, field: 'from' }),
    to: str(body.to, { max: 5, required: true, field: 'to' }),
    place: str(body.place, { min: 2, max: 120, required: true, field: 'place' }),
  };
  if (!isValidPickup(pickup)) fail(400, 'bad_pickup');
  const school = await getSchool();
  const start = localDateTime(pickup.date, pickup.from, school.utcOffset);
  const end = localDateTime(pickup.date, pickup.to, school.utcOffset);
  if (!start || !end || end.getTime() <= Date.now()) fail(400, 'pickup_in_past');
  if (start.getTime() - Date.now() > 30 * 24 * 3600 * 1000) fail(400, 'pickup_too_far');
  const holdUntil = addHours(end, school.pickupGraceHours).toISOString();
  return transition(actor, reservationId, 'ready', {
    staff: true,
    note: `${pickup.date} ${pickup.from}–${pickup.to}, ${pickup.place}`,
    patch: (r) => ({
      pickup: { ...pickup, start: start.toISOString(), end: end.toISOString() },
      cancelBefore: start.toISOString(),
      holdUntil,
      preparedAt: new Date().toISOString(),
      preparedBy: actor.uid,
      // A changed pickup time needs a new e-mail.
      notification: { ...(r.notification || {}), status: 'pending', attempts: Number(r.notification?.attempts) || 0 },
    }),
  });
}

export async function issue(actor, reservationId, body) {
  const school = await getSchool();
  const loanDays = body.loanDays ? int(body.loanDays, { min: 1, max: 120, field: 'loanDays' }) : school.loanDays;
  return transition(actor, reservationId, 'issued', {
    staff: true,
    note: str(body.note, { max: 300, field: 'note' }),
    patch: () => {
      const now = new Date();
      return { issuedAt: now.toISOString(), issuedBy: actor.uid, dueDate: addHours(now, loanDays * 24).toISOString(), holdUntil: null };
    },
  }).then(async (res) => {
    // Handing a book over starts «Читаю» if the reader had no status yet.
    // Outside the stock transaction: the reading mark is the reader's own data.
    try {
      const ref = coll('reading_progress').doc(`${res.uid}__${res.bookId}`);
      const snap = await ref.get();
      const cur = snap.exists ? snap.data() : null;
      if (!cur || (cur.status === 'want' && cur.verificationStatus === 'none')) {
        const book = catalogBook(res.bookId) || {};
        const now = new Date().toISOString();
        await ref.set({
          ...(cur || {}),
          uid: res.uid, email: res.userEmail || '', bookId: res.bookId, bookTitle: res.bookTitle || book.title || '', bookAuthor: res.bookAuthor || book.author || '',
          language: book.language || '', genre: book.genre || '', isHundred: Boolean(cur?.isHundred), hundredId: cur?.hundredId || '', inCatalog: true,
          status: 'reading', verificationStatus: 'none', startedAt: now, updatedAt: now, createdAt: cur?.createdAt || now,
        });
      }
    } catch {
      // not critical
    }
    return res;
  });
}

export async function returnBook(actor, reservationId, body = {}) {
  return transition(actor, reservationId, 'returned', {
    staff: true,
    note: str(body.note, { max: 300, field: 'note' }),
    extraReads: lockRead,
    patch: () => ({ returnedAt: new Date().toISOString(), returnedBy: actor.uid }),
  });
}

// Walk-in: the librarian hands a book to a reader who did not reserve it.
export async function directIssue(actor, body) {
  const bookId = idParam(str(body.bookId, { max: 60, required: true, field: 'bookId' }), 'bookId');
  const email = str(body.email, { max: 120, required: true, field: 'email' }).toLowerCase();
  const school = await getSchool();
  const loanDays = body.loanDays ? int(body.loanDays, { min: 1, max: 120, field: 'loanDays' }) : school.loanDays;
  const found = await coll('profiles').where('email', '==', email).limit(1).get();
  if (found.empty) fail(404, 'student_not_found');
  const profile = found.docs[0].data();
  const uid = found.docs[0].id;
  assertNotSelf(actor, uid);
  const book = catalogBook(bookId);
  if (!book) fail(404, 'unknown_book');
  const resRef = coll('reservations').doc();
  const lRef = lockRef(uid, bookId);
  return db().runTransaction(async (tx) => {
    const lock = await tx.get(lRef);
    if (lock.exists) {
      const other = await tx.get(coll('reservations').doc(lock.data().reservationId));
      if (other.exists && OPEN.includes(normalizeStatus(other.data().status))) fail(409, 'already_reserved', { reservationId: other.id });
    }
    const inv = await readInventory(tx, bookId);
    const next = change(inv, { issued: 1 });
    const now = new Date();
    const data = {
      code: reservationCode(),
      uid,
      userEmail: profile.email,
      userName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email,
      className: profile.className || '',
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      status: 'issued',
      holding: false,
      holdUntil: null,
      pickup: null,
      notification: { status: 'not_needed', attempts: 0 },
      issuedAt: now.toISOString(),
      issuedBy: actor.uid,
      dueDate: addHours(now, loanDays * 24).toISOString(),
      walkIn: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      history: [historyItem('issued', actor, 'Выдача без брони')],
    };
    tx.create(resRef, data);
    tx.set(lRef, { reservationId: resRef.id, uid, bookId, createdAt: now.toISOString() });
    writeInventory(tx, inv, next, { action: 'issue', delta: { issued: 1 }, reservationId: resRef.id, actor, reason: 'walk-in' });
    audit(tx, actor, 'reservation_direct_issue', 'reservations', resRef.id, null, { bookId, uid });
    return { id: resRef.id, ...data, availability: availability(next) };
  });
}

// ---------- expiry ----------
async function expireOne(ref) {
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const r = { id: snap.id, ...snap.data() };
    if (!isHoldExpired(r)) return false;
    const inv = await readInventory(tx, r.bookId);
    const lock = await tx.get(lockRef(r.uid, r.bookId));
    const delta = r.holding ? { held: -1 } : {};
    const next = r.holding ? change(inv, delta) : null;
    const now = new Date().toISOString();
    tx.update(ref, { status: 'expired', holding: false, expiredAt: now, updatedAt: now, history: [...(r.history || []).slice(-30), historyItem('expired', SYSTEM)] });
    if (next) writeInventory(tx, inv, next, { action: 'expired', delta, reservationId: ref.id, actor: SYSTEM });
    if (lock.exists && lock.data().reservationId === ref.id) tx.delete(lockRef(r.uid, r.bookId));
    return true;
  }).catch(() => false);
}

export async function expireForBook(bookId) {
  const snap = await coll('reservations').where('bookId', '==', bookId).where('status', 'in', ['requested', 'ready']).get();
  let n = 0;
  for (const d of snap.docs) {
    if (isHoldExpired(d.data())) n += (await expireOne(d.ref)) ? 1 : 0;
  }
  return n;
}

export async function expireAll() {
  const snap = await coll('reservations').where('status', 'in', ['requested', 'ready']).get();
  let n = 0;
  for (const d of snap.docs) {
    if (isHoldExpired(d.data())) n += (await expireOne(d.ref)) ? 1 : 0;
  }
  return { expired: n };
}

// ---------- staff views ----------
export async function listReservations(query = {}) {
  await expireAll();
  let q = coll('reservations');
  const status = String(query.status || '');
  if (status === 'open') q = q.where('status', 'in', ['requested', 'ready', 'issued', 'active']);
  else if (['requested', 'ready', 'issued', 'returned', 'cancelled', 'expired', 'active'].includes(status)) q = q.where('status', '==', status);
  const snap = await q.limit(500).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status) }))
    .sort((a, b) => String(b.createdAt || b.reservedAt || '').localeCompare(String(a.createdAt || a.reservedAt || '')));
}

export async function adjustFund(actor, bookId, body) {
  const id = idParam(bookId, 'bookId');
  const total = int(body.total, { min: 0, max: 10000, field: 'total' });
  const reason = str(body.reason, { min: 3, max: 300, required: true, field: 'reason' });
  return db().runTransaction(async (tx) => {
    const inv = await readInventory(tx, id);
    const cur = availability(inv.data);
    if (total < cur.held + cur.issued) fail(409, 'below_in_use', { inUse: cur.held + cur.issued });
    const next = change(inv, { total: total - cur.total });
    writeInventory(tx, { ...inv, data: { ...inv.data, source: 'manual' } }, next, { action: 'adjust', delta: { total: total - cur.total }, actor, reason });
    audit(tx, actor, 'fund_adjusted', 'inventory', id, { total: cur.total }, { total }, reason);
    return { bookId: id, ...next };
  });
}

export async function inventoryLog(bookId) {
  const snap = await coll('inventory_log').where('bookId', '==', idParam(bookId, 'bookId')).limit(200).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
