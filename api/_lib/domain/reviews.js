// Book reviews. reviews/{uid}__{bookId} — one review per reader and book.
// A new or edited review is «pending» until a librarian publishes it; only
// published reviews are readable by others (firestore.rules). Publishing a review
// and confirming a reading are separate decisions.
// The author is shown as «Имя Ф., 10A» or «Читатель, 10 класс» — never the
// e-mail or the full surname.
import { db } from '../admin.js';
import { fail, str, id as idParam, oneOf } from '../http.js';
import { audit } from '../audit.js';
import { assertNotSelf } from '../auth.js';
import { rateLimit } from '../rateLimit.js';
import { resolveTrackable } from '../catalog.js';
import { validateReview } from '../../../src/lib/reviews.js';
import { readerLabel } from '../../../src/lib/school.js';

const coll = (name) => db().collection(name);

/**
 * Creates or updates the reader's review inside a transaction.
 * Returns { ok:false, errors } instead of throwing when the text is not acceptable,
 * so a reading request with an unpublishable review still goes through.
 */
export async function upsertReviewInTx(tx, actor, book, input, source = 'review') {
  const v = validateReview(input);
  if (!v.ok) return { ok: false, errors: v.errors };
  const ref = coll('reviews').doc(`${actor.uid}__${book.bookId}`);
  const [snap, pSnap] = await Promise.all([tx.get(ref), tx.get(coll('profiles').doc(actor.uid))]);
  const cur = snap.exists ? snap.data() : null;
  if (cur && cur.text === v.value.text && cur.rating === v.value.rating) return { ok: true, unchanged: true, status: cur.status };
  const profile = pSnap.exists ? pSnap.data() : {};
  const now = new Date().toISOString();
  tx.set(ref, {
    uid: actor.uid,
    bookId: book.bookId,
    bookTitle: book.title,
    bookAuthor: book.author || '',
    hundredId: book.hundredId || '',
    rating: v.value.rating,
    text: v.value.text,
    status: 'pending',
    authorLabel: readerLabel({ shortName: profile.shortName, className: profile.className, privacyMode: profile.privacyMode }),
    source,
    createdAt: cur?.createdAt || now,
    updatedAt: now,
    editCount: cur ? (Number(cur.editCount) || 0) + 1 : 0,
    publishedAt: null,
    moderatedBy: null,
    moderatedAt: null,
    moderationNote: '',
  });
  return { ok: true, status: 'pending' };
}

export async function upsertMyReview(actor, body) {
  const book = resolveTrackable(str(body.bookId, { max: 60, field: 'bookId' }), str(body.hundredId, { max: 20, field: 'hundredId' }));
  if (!book) fail(404, 'unknown_book');
  await rateLimit(`review_${actor.uid}`, { limit: 5, windowSec: 86400 });
  const result = await db().runTransaction((tx) => upsertReviewInTx(tx, actor, book, { rating: body.rating, text: body.text }));
  if (!result.ok) fail(400, 'invalid_review', { errors: result.errors });
  return result;
}

export async function deleteMyReview(actor, body) {
  const bookId = str(body.bookId, { max: 60, required: true, field: 'bookId' });
  const ref = coll('reviews').doc(`${actor.uid}__${idParam(bookId, 'bookId')}`);
  const snap = await ref.get();
  if (!snap.exists) fail(404, 'not_found');
  if (snap.data().uid !== actor.uid) fail(403, 'forbidden');
  await ref.delete();
  return { deleted: true };
}

export async function listReviews(query = {}) {
  const status = ['pending', 'published', 'rejected'].includes(query.status) ? query.status : 'pending';
  const snap = await coll('reviews').where('status', '==', status).limit(300).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function moderateReview(actor, reviewId, body) {
  const decision = oneOf(body.decision, ['publish', 'reject'], 'decision');
  const note = str(body.note, { max: 300, field: 'note' });
  if (decision === 'reject' && note.length < 3) fail(400, 'missing_field', { field: 'note' });
  const ref = coll('reviews').doc(idParam(reviewId, 'reviewId'));
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'not_found');
    const review = snap.data();
    assertNotSelf(actor, review.uid);
    const now = new Date().toISOString();
    const status = decision === 'publish' ? 'published' : 'rejected';
    if (review.status === status) fail(409, 'already_decided');
    tx.update(ref, {
      status,
      moderatedBy: actor.uid,
      moderatedAt: now,
      moderationNote: note,
      publishedAt: status === 'published' ? now : null,
    });
    audit(tx, actor, `review_${status}`, 'reviews', ref.id, { status: review.status }, { status }, note);
    return { id: ref.id, status };
  });
}
