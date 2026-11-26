// Reader-side data. Reads come straight from Firestore (own documents and public
// documents, as allowed by firestore.rules); every change goes through the API,
// where the server checks the user, the role and the rules.
// onSnapshot keeps the reading list and reservations in sync between devices.
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, setDoc, deleteDoc, addDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { session } from '@/stores/session';
import { post } from '@/services/api';
import { getBookId } from '@/lib/bookId';
import { availability, normalizeStatus } from '@/lib/loans';
import { isValidCertificateNumber } from '@/lib/workflow';

// ---------- 100 kitap list ----------
let hundredCache = null;
export async function loadHundredBooks() {
  if (hundredCache) return hundredCache;
  const res = await fetch('/data/hundred-books.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('hundred_books_unavailable');
  hundredCache = await res.json();
  return hundredCache;
}

export function trackId(entry) {
  return entry.catalogBookId || entry.id;
}

// ---------- reading progress ----------
export function watchMyProgress(callback) {
  if (!session.uid) {
    callback(new Map());
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'reading_progress'), where('uid', '==', session.uid)),
    (snap) => {
      const map = new Map();
      snap.forEach((d) => map.set(d.data().bookId, { id: d.id, ...d.data() }));
      callback(map);
    },
    () => callback(new Map()),
  );
}

export const setReadingStatus = (bookId, status, hundredId = '') => post('reading/status', { bookId, hundredId, status });
export const requestVerification = (bookId, data = {}, hundredId = '') => post('reading/verify', { bookId, hundredId, ...data });
export const withdrawVerification = (bookId, hundredId = '') => post('reading/withdraw', { bookId, hundredId });

// ---------- fund ----------
// Counters from inventory/{bookId}; a book nobody reserved yet has all its
// catalog copies free.
export async function getAvailability(book) {
  const bookId = book.bookId || getBookId(book);
  try {
    const snap = await getDoc(doc(db, 'inventory', bookId));
    if (snap.exists()) return availability(snap.data());
  } catch {
    // fall back to the catalog
  }
  const copies = Number(book.copies ?? book.catalogCopies ?? 0) || 0;
  return availability({ total: copies, held: 0, issued: 0 });
}

export function watchAvailability(book, callback) {
  const bookId = book.bookId || getBookId(book);
  const fallback = availability({ total: Number(book.copies ?? 0) || 0 });
  return onSnapshot(doc(db, 'inventory', bookId), (snap) => callback(snap.exists() ? availability(snap.data()) : fallback), () => callback(fallback));
}

export async function getAvailabilityMany(bookIds) {
  const out = new Map();
  const ids = [...new Set(bookIds.filter(Boolean))];
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    try {
      const snap = await getDocs(query(collection(db, 'inventory'), where('bookId', 'in', chunk)));
      snap.forEach((d) => out.set(d.id, availability(d.data())));
    } catch {
      // counts unknown → the caller falls back to catalog copies
    }
  }
  return out;
}

// ---------- reservations ----------
function requestKey() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
export const reserveBook = (bookId) => post('reservations', { bookId, requestKey: requestKey() });
export const cancelReservation = (id) => post(`reservations/${encodeURIComponent(id)}/cancel`);

export function watchMyReservations(callback) {
  if (!session.uid) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    query(collection(db, 'reservations'), where('uid', '==', session.uid)),
    (snap) => callback(snap.docs
      .map((d) => ({ id: d.id, ...d.data(), status: normalizeStatus(d.data().status) }))
      .sort((a, b) => String(b.createdAt || b.reservedAt || '').localeCompare(String(a.createdAt || a.reservedAt || '')))),
    () => callback([]),
  );
}

// ---------- reviews ----------
export async function listPublishedReviews(bookId) {
  const snap = await getDocs(query(collection(db, 'reviews'), where('bookId', '==', bookId), where('status', '==', 'published')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
}
export async function getMyReview(bookId) {
  if (!session.uid) return null;
  try {
    const snap = await getDoc(doc(db, 'reviews', `${session.uid}__${bookId}`));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch {
    return null;
  }
}
export const saveReview = (bookId, rating, text, hundredId = '') => post('reviews', { bookId, hundredId, rating, text });
export const deleteReview = (bookId) => post('reviews/delete', { bookId });

// ---------- points & rewards ----------
export async function getMyPoints() {
  if (!session.uid) return { summary: null, ledger: [] };
  const [sp, ledger] = await Promise.all([
    getDoc(doc(db, 'student_points', session.uid)).catch(() => null),
    getDocs(query(collection(db, 'points_ledger'), where('uid', '==', session.uid))).catch(() => null),
  ]);
  return {
    summary: sp?.exists() ? sp.data() : null,
    ledger: ledger ? ledger.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))) : [],
  };
}

export async function listRewardCatalog() {
  const snap = await getDocs(collection(db, 'rewards'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === 'active');
}
export async function listMyRewardIssues() {
  if (!session.uid) return [];
  const snap = await getDocs(query(collection(db, 'reward_issues'), where('uid', '==', session.uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
export const claimReward = (rewardId) => post(`rewards/${encodeURIComponent(rewardId)}/claim`);

export async function getCertificate(number) {
  if (!isValidCertificateNumber(number)) return null;
  const snap = await getDoc(doc(db, 'certificates', number));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- leaderboard ----------
export async function listLeaderboardRows() {
  const snap = await getDocs(collection(db, 'leaderboard'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- bookmarks & view events (client-written, own data only) ----------
export async function isBookmarked(bookId) {
  if (!session.uid) return false;
  try {
    return (await getDoc(doc(db, 'bookmarks', `${session.uid}__${bookId}`))).exists();
  } catch {
    return false;
  }
}
export async function setBookmark(book, value) {
  const bookId = book.bookId || getBookId(book);
  const ref = doc(db, 'bookmarks', `${session.uid}__${bookId}`);
  if (value) {
    await setDoc(ref, {
      uid: session.uid, bookId, bookTitle: String(book.title || '').slice(0, 300), bookAuthor: String(book.author || '').slice(0, 200),
      language: book.language || '', genre: Array.isArray(book.genre) ? book.genre[0] || '' : book.genre || '', createdAt: new Date().toISOString(),
    });
  } else {
    await deleteDoc(ref);
  }
}
export async function logView(book) {
  if (!session.uid || !session.emailVerified) return;
  const bookId = book.bookId || getBookId(book);
  try {
    const key = `nk_view_${bookId}_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    await addDoc(collection(db, 'reading_events'), {
      uid: session.uid, type: 'view', source: 'web', occurredAt: new Date().toISOString(), metadata: {},
      bookId, bookTitle: String(book.title || '').slice(0, 300), bookAuthor: String(book.author || '').slice(0, 200),
      language: book.language || '', genre: Array.isArray(book.genre) ? book.genre[0] || '' : book.genre || '', isHundred: false, hundredId: '',
    });
  } catch {
    // statistics only
  }
}
