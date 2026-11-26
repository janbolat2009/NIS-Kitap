// Reading list and verification.
// reading_progress/{uid}__{bookId}:
//   status              want | reading | finished      — the student's own mark
//   verificationStatus  none | pending | confirmed | rejected | revoked
// «Прочитано» (status finished) is a personal mark and gives no points.
// Points are written only when a librarian confirms a pending request, in the
// same transaction, with deterministic ledger ids — one action, one credit.
import { db } from '../admin.js';
import { fail, str, int, bool, oneOf, id as idParam } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';
import { rateLimit } from '../rateLimit.js';
import { getSchool, getRules } from '../settings.js';
import { resolveTrackable } from '../catalog.js';
import { writeEntries, onlyNew, snapshotOf, reverseEntry } from './points.js';
import { upsertReviewInTx } from './reviews.js';
import { entriesForConfirmation, milestoneEntries, actionOf, reversalEntry } from '../../../src/lib/points.js';
import { sanitizeReviewText } from '../../../src/lib/reviews.js';

const coll = (name) => db().collection(name);
const STATUSES = ['want', 'reading', 'finished', 'none'];

function bookOf(body) {
  const bookId = str(body.bookId, { max: 60, field: 'bookId' });
  const hundredId = str(body.hundredId, { max: 20, field: 'hundredId' });
  const book = resolveTrackable(bookId, hundredId);
  if (!book) fail(404, 'unknown_book');
  return book;
}

function progressFields(actor, book) {
  return {
    uid: actor.uid,
    email: actor.email,
    bookId: book.bookId,
    bookTitle: book.title,
    bookAuthor: book.author,
    language: book.language || '',
    genre: book.genre || '',
    isHundred: Boolean(book.isHundred),
    hundredId: book.hundredId || '',
    inCatalog: Boolean(book.inCatalog),
  };
}

function event(type, actorUid, progress, extra = {}) {
  return {
    uid: progress.uid,
    actorUid,
    type,
    source: 'api',
    bookId: progress.bookId || '',
    bookTitle: progress.bookTitle || '',
    bookAuthor: progress.bookAuthor || '',
    language: progress.language || '',
    genre: progress.genre || '',
    isHundred: Boolean(progress.isHundred),
    occurredAt: new Date().toISOString(),
    metadata: extra,
  };
}

function historyItem(status, actor, note = '') {
  return { status, at: new Date().toISOString(), by: actor.uid, role: actor.role, note: String(note || '').slice(0, 300) };
}

// ---------- student ----------
export async function setStatus(actor, body) {
  const status = oneOf(body.status, STATUSES, 'status');
  const book = bookOf(body);
  await rateLimit(`reading_${actor.uid}`, { limit: 120, windowSec: 3600 });
  const ref = coll('reading_progress').doc(`${actor.uid}__${book.bookId}`);
  const now = new Date().toISOString();
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() : null;
    if (cur && ['pending', 'confirmed'].includes(cur.verificationStatus)) fail(409, 'locked');
    if (status === 'none') {
      if (snap.exists) tx.delete(ref);
      return { id: ref.id, status: 'none' };
    }
    const next = {
      ...(cur || {}),
      ...progressFields(actor, book),
      status,
      verificationStatus: 'none',
      updatedAt: now,
      createdAt: cur?.createdAt || now,
    };
    if (status === 'reading' && !next.startedAt) next.startedAt = now;
    if (status === 'finished') next.finishedAt = cur?.finishedAt || now;
    tx.set(ref, next);
    tx.set(coll('reading_events').doc(), event(`status_${status}`, actor.uid, next));
    return { id: ref.id, ...next };
  });
}

export async function requestVerification(actor, body) {
  const book = bookOf(body);
  await rateLimit(`verify_${actor.uid}`, { limit: 20, windowSec: 86400 });
  const review = sanitizeReviewText(str(body.review, { max: 4000, field: 'review' }));
  const rating = body.rating === undefined || body.rating === null || body.rating === '' ? null : int(body.rating, { min: 1, max: 5, field: 'rating' });
  const publish = bool(body.publishReview);
  const ref = coll('reading_progress').doc(`${actor.uid}__${book.bookId}`);
  const now = new Date().toISOString();
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() : null;
    if (cur?.verificationStatus === 'confirmed') fail(409, 'already_confirmed');
    if (cur?.verificationStatus === 'pending') fail(409, 'already_pending');
    let reviewResult = null;
    if (publish && review) reviewResult = await upsertReviewInTx(tx, actor, book, { rating: rating || 5, text: review }, 'hundred_request');
    const next = {
      ...(cur || {}),
      ...progressFields(actor, book),
      status: 'finished',
      verificationStatus: 'pending',
      method: 'review',
      review,
      rating,
      publishReview: publish,
      finishedAt: cur?.finishedAt || now,
      requestedAt: now,
      updatedAt: now,
      createdAt: cur?.createdAt || now,
      history: [...(cur?.history || []).slice(-20), historyItem('pending', actor)],
    };
    tx.set(ref, next);
    tx.set(coll('reading_events').doc(), event('verification_request', actor.uid, next));
    return { id: ref.id, ...next, reviewResult };
  });
}

export async function withdrawRequest(actor, body) {
  const book = bookOf(body);
  const ref = coll('reading_progress').doc(`${actor.uid}__${book.bookId}`);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().verificationStatus !== 'pending') fail(409, 'not_pending');
    const now = new Date().toISOString();
    tx.update(ref, { verificationStatus: 'none', updatedAt: now, history: [...(snap.data().history || []).slice(-20), historyItem('withdrawn', actor)] });
    return { id: ref.id, verificationStatus: 'none' };
  });
}

// ---------- staff ----------
const DAY = 24 * 3600 * 1000;

function flagsFor(p, history, loanReturned) {
  const flags = [];
  const at = new Date(p.requestedAt || 0).getTime();
  const sameDay = history.filter((h) => Math.abs(new Date(h.requestedAt || 0).getTime() - at) < DAY);
  if (sameDay.length > 5) flags.push('many_requests_24h');
  const review = String(p.review || '').trim().toLowerCase();
  if (!review) flags.push('no_review');
  else if (review.length < 40) flags.push('short_review');
  if (review && history.some((h) => h.id !== p.id && String(h.review || '').trim().toLowerCase() === review)) flags.push('duplicate_review');
  if (p.startedAt && at - new Date(p.startedAt).getTime() < 3600 * 1000 && !loanReturned) flags.push('finished_too_fast');
  if (loanReturned) flags.push('loan_returned');
  return flags;
}

export async function verificationQueue() {
  const pendingSnap = await coll('reading_progress').where('verificationStatus', '==', 'pending').get();
  const pending = pendingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const uids = [...new Set(pending.map((p) => p.uid))];
  const profiles = new Map();
  const returned = new Set();
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const [ps, rs] = await Promise.all([
      coll('profiles').where('uid', 'in', chunk).get(),
      coll('reservations').where('uid', 'in', chunk).where('status', '==', 'returned').get(),
    ]);
    ps.forEach((d) => profiles.set(d.id, d.data()));
    rs.forEach((d) => returned.add(`${d.get('uid')}__${d.get('bookId')}`));
  }
  const byUid = new Map();
  for (const p of pending) byUid.set(p.uid, [...(byUid.get(p.uid) || []), p]);
  return pending
    .map((p) => {
      const prof = profiles.get(p.uid) || {};
      const loanReturned = returned.has(`${p.uid}__${p.bookId}`);
      return {
        ...p,
        student: {
          name: [prof.firstName, prof.lastName].filter(Boolean).join(' ') || p.email,
          email: prof.email || p.email,
          className: prof.className || '',
          shanyrakName: prof.shanyrakName || '',
          emailVerified: prof.emailVerified !== false,
        },
        loanReturned,
        flags: flagsFor(p, byUid.get(p.uid) || [], loanReturned),
      };
    })
    .sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
}

// Confirms inside a transaction. Shared by the queue and the manual confirmation.
async function confirmInTx(tx, actor, ref, progress, { reviewAccepted, note, method }) {
  const [school, rules] = await Promise.all([getSchool(tx), getRules(tx)]);
  const pSnap = await tx.get(coll('profiles').doc(progress.uid));
  const spSnap = await tx.get(coll('student_points').doc(progress.uid));
  const profile = pSnap.exists ? pSnap.data() : null;
  const round = (Number(progress.confirmations) || 0) + 1;
  const key = round > 1 ? `${ref.id}__r${round}` : ref.id;
  const snapshot = snapshotOf(profile, school);
  const now = new Date();
  const confirmedBefore = Number(spSnap.exists ? spSnap.data().confirmedBooks : 0) || 0;
  const entries = [
    ...entriesForConfirmation({ ...progress, id: key }, { rules, reviewAccepted, snapshot, actor, now }),
    ...milestoneEntries(progress.uid, confirmedBefore + 1, { rules, snapshot, actor, now }),
  ].map((e) => (e.sourceType === 'reading_progress' ? { ...e, sourceId: ref.id } : e));
  const fresh = await onlyNew(tx, entries);
  const after = {
    ...progress,
    status: 'finished',
    verificationStatus: 'confirmed',
    verifiedBy: actor.uid,
    verifiedByRole: actor.role,
    verifiedAt: now.toISOString(),
    reviewAccepted: Boolean(reviewAccepted),
    decisionNote: String(note || '').slice(0, 500),
    method: method || progress.method || 'manual',
    confirmations: round,
    pointsAwarded: fresh.reduce((s, e) => s + (Number(e.points) || 0), 0),
    updatedAt: now.toISOString(),
    history: [...(progress.history || []).slice(-20), historyItem('confirmed', actor, note)],
  };
  delete after.id;
  tx.set(ref, after);
  writeEntries(tx, fresh, profile);
  tx.set(coll('reading_events').doc(), event('confirmed', actor.uid, after, { method: after.method }));
  audit(tx, actor, 'reading_confirmed', 'reading_progress', ref.id,
    { verificationStatus: progress.verificationStatus }, { verificationStatus: 'confirmed', points: after.pointsAwarded, entries: fresh.map((e) => e.id) }, note);
  return { id: ref.id, points: after.pointsAwarded, entries: fresh.map((e) => ({ id: e.id, action: e.action, points: e.points })) };
}

export async function confirmReading(actor, progressId, body) {
  const ref = coll('reading_progress').doc(idParam(progressId, 'progressId'));
  const note = str(body.note, { max: 500, field: 'note' });
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const progress = snap.data();
    assertNotSelf(actor, progress.uid);
    if (progress.verificationStatus !== 'pending') fail(409, 'already_decided');
    return confirmInTx(tx, actor, ref, progress, { reviewAccepted: bool(body.reviewAccepted), note, method: progress.method });
  });
}

export async function rejectReading(actor, progressId, body) {
  const ref = coll('reading_progress').doc(idParam(progressId, 'progressId'));
  const note = str(body.note, { min: 3, max: 500, required: true, field: 'note' });
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const progress = snap.data();
    assertNotSelf(actor, progress.uid);
    if (progress.verificationStatus !== 'pending') fail(409, 'already_decided');
    const now = new Date().toISOString();
    const after = {
      verificationStatus: 'rejected',
      verifiedBy: actor.uid,
      verifiedByRole: actor.role,
      verifiedAt: now,
      decisionNote: note,
      updatedAt: now,
      history: [...(progress.history || []).slice(-20), historyItem('rejected', actor, note)],
    };
    tx.update(ref, after);
    tx.set(coll('reading_events').doc(), event('rejected', actor.uid, progress));
    audit(tx, actor, 'reading_rejected', 'reading_progress', ref.id, { verificationStatus: 'pending' }, { verificationStatus: 'rejected' }, note);
    return { id: ref.id, verificationStatus: 'rejected' };
  });
}

// Librarian checked the reading in person (no request from the student).
export async function manualConfirm(actor, body) {
  const uid = idParam(body.uid, 'uid');
  assertNotSelf(actor, uid);
  const note = str(body.note, { min: 3, max: 500, required: true, field: 'note' });
  const book = bookOf(body);
  const ref = coll('reading_progress').doc(`${uid}__${book.bookId}`);
  return db().runTransaction(async (tx) => {
    const pSnap = await tx.get(coll('profiles').doc(uid));
    if (!pSnap.exists) fail(404, 'student_not_found');
    const profile = pSnap.data();
    if (profile.emailVerified === false) fail(409, 'student_email_not_verified');
    const snap = await tx.get(ref);
    const cur = snap.exists ? snap.data() : null;
    if (cur?.verificationStatus === 'confirmed') fail(409, 'already_decided');
    const now = new Date().toISOString();
    const progress = {
      ...(cur || {}),
      ...progressFields({ uid, email: profile.email }, book),
      status: 'finished',
      verificationStatus: 'pending',
      method: 'in_person',
      finishedAt: cur?.finishedAt || now,
      requestedAt: cur?.requestedAt || now,
      createdAt: cur?.createdAt || now,
    };
    return confirmInTx(tx, actor, ref, progress, { reviewAccepted: false, note, method: 'in_person' });
  });
}

// Cancels a confirmation made by mistake: every active entry of this reading is
// reversed and the student sees «подтверждение отменено» with the reason.
export async function revokeConfirmation(actor, progressId, body) {
  const ref = coll('reading_progress').doc(idParam(progressId, 'progressId'));
  const reason = str(body.reason, { min: 5, max: 300, required: true, field: 'reason' });
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const progress = snap.data();
    assertNotSelf(actor, progress.uid);
    if (progress.verificationStatus !== 'confirmed') fail(409, 'not_confirmed');
    const entries = await tx.get(coll('points_ledger').where('sourceId', '==', ref.id).where('uid', '==', progress.uid));
    const active = entries.docs.filter((d) => !d.get('reversed') && actionOf(d.data()) !== 'reversal');
    // Reads for every reversal must happen before any write.
    const reversals = [];
    for (const d of active) {
      const revId = `reversal__${d.id}`;
      const revSnap = await tx.get(coll('points_ledger').doc(revId));
      if (!revSnap.exists) reversals.push(d);
    }
    const pSnap = await tx.get(coll('profiles').doc(progress.uid));
    const now = new Date().toISOString();
    const revs = reversals.map((d) => reversalEntry({ id: d.id, ...d.data() }, { actor, reason }));
    writeEntries(tx, revs, pSnap.exists ? pSnap.data() : null);
    for (const d of reversals) {
      tx.update(d.ref, { reversed: true, reversedAt: now, reversedBy: actor.uid, reversedByRole: actor.role, reversalId: `reversal__${d.id}`, reversalReason: reason });
    }
    tx.update(ref, {
      verificationStatus: 'revoked',
      decisionNote: reason,
      updatedAt: now,
      history: [...(progress.history || []).slice(-20), historyItem('revoked', actor, reason)],
    });
    audit(tx, actor, 'reading_confirmation_revoked', 'reading_progress', ref.id, { verificationStatus: 'confirmed' }, { verificationStatus: 'revoked', reversed: revs.map((r) => r.id) }, reason);
    return { id: ref.id, reversed: revs.length };
  });
}

export { reverseEntry };
