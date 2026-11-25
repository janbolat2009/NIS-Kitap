// Student-side reading data: 100-books list, progress, verification requests,
// bookmarks, reading events and the student's own points and rewards.
// All writes go through Firestore Security Rules (firestore.rules).
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { session } from '@/stores/session';
import { getBookId } from '@/lib/bookId';
import { summarizeLedger } from '@/lib/points';

let hundredCache = null;

export async function loadHundredBooks() {
  if (hundredCache) return hundredCache;
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  const urls = ['/data/hundred-books.json', `${base}/data/hundred-books.json`];
  let lastError = null;
  for (const url of [...new Set(urls)]) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) {
        hundredCache = await res.json();
        return hundredCache;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('hundred_books_unavailable');
}

export function hundredEntryToBook(entry) {
  const sectionLanguage = entry.section === 'kazakh' ? 'Қазақ' : entry.section === 'russian' ? 'Русский' : '';
  return {
    bookId: entry.catalogBookId || `bk_${entry.id}`,
    title: entry.catalogTitle || entry.title,
    author: entry.author,
    language: entry.catalogLanguage || sectionLanguage,
    genre: entry.genre,
    isHundred: true,
    hundredId: entry.id,
  };
}

function bookFields(book) {
  const genre = Array.isArray(book.genre) ? book.genre[0] || '' : book.genre || '';
  return {
    bookId: book.bookId || getBookId(book),
    bookTitle: String(book.title || '').slice(0, 300),
    bookAuthor: String(book.author || '').slice(0, 200),
    language: book.language || '',
    genre,
    isHundred: Boolean(book.isHundred),
    hundredId: book.hundredId || '',
  };
}

function fail(code) {
  const err = new Error(code);
  err.code = code;
  throw err;
}

function requireUser() {
  if (!session.uid) fail('auth_required');
  if (!session.emailVerified) fail('email_not_verified');
}

export function progressDocId(uid, bookId) {
  return `${uid}__${bookId}`;
}

// ---------- events ----------
const VIEW_KEY = 'nis_kitap_viewed';

export async function logReadingEvent(type, book, metadata = {}) {
  if (!session.uid || !session.emailVerified) return;
  const fields = bookFields(book);
  if (type === 'view') {
    // One view per book per day per browser is enough for analytics.
    try {
      const key = `${fields.bookId}:${new Date().toISOString().slice(0, 10)}`;
      const seen = JSON.parse(sessionStorage.getItem(VIEW_KEY) || '[]');
      if (seen.includes(key)) return;
      sessionStorage.setItem(VIEW_KEY, JSON.stringify([...seen.slice(-200), key]));
    } catch {
      // storage unavailable
    }
  }
  try {
    await addDoc(collection(db, 'reading_events'), {
      uid: session.uid,
      type,
      source: metadata.source || 'web',
      occurredAt: serverTimestamp(),
      metadata: metadata.data || {},
      ...fields,
    });
  } catch (err) {
    // Analytics must never break the page.
    console.warn('reading event not saved:', err.code || err.message);
  }
}

// ---------- progress ----------
export async function getMyProgress() {
  if (!session.uid) return new Map();
  const snap = await getDocs(query(collection(db, 'reading_progress'), where('uid', '==', session.uid)));
  const map = new Map();
  snap.forEach((d) => map.set(d.data().bookId, { id: d.id, ...d.data() }));
  return map;
}

async function currentProgress(bookId) {
  const ref = doc(db, 'reading_progress', progressDocId(session.uid, bookId));
  const snap = await getDoc(ref);
  const current = snap.exists() ? snap.data() : null;
  if (current && ['pending', 'confirmed'].includes(current.verificationStatus)) fail('locked');
  return { ref, current };
}

export async function setReadingStatus(book, status) {
  requireUser();
  if (!['want', 'reading', 'finished'].includes(status)) fail('bad_status');
  const fields = bookFields(book);
  const { ref, current } = await currentProgress(fields.bookId);
  const now = new Date().toISOString();
  const next = {
    ...(current || {}),
    uid: session.uid,
    email: session.email,
    ...fields,
    status,
    verificationStatus: 'none',
    updatedAt: now,
    createdAt: current?.createdAt || now,
  };
  if (status === 'reading' && !current?.startedAt) next.startedAt = now;
  if (status === 'finished') next.finishedAt = now;
  await setDoc(ref, next);
  return { id: ref.id, ...next };
}

export async function clearReadingStatus(book) {
  requireUser();
  const fields = bookFields(book);
  const { ref, current } = await currentProgress(fields.bookId);
  if (current && current.verificationStatus === 'none') await deleteDoc(ref);
}

/**
 * Sends a book to the librarian for confirmation. Points are NOT given here:
 * only a librarian's confirmation creates ledger entries.
 */
export async function requestVerification(book, { review = '', method = 'review' } = {}) {
  requireUser();
  const fields = bookFields(book);
  const { ref, current } = await currentProgress(fields.bookId);
  const now = new Date().toISOString();
  const next = {
    ...(current || {}),
    uid: session.uid,
    email: session.email,
    ...fields,
    status: 'finished',
    verificationStatus: 'pending',
    method: ['review', 'loan_returned', 'quiz', 'manual'].includes(method) ? method : 'review',
    review: String(review || '').trim().slice(0, 4000),
    finishedAt: current?.finishedAt || now,
    requestedAt: now,
    updatedAt: now,
    createdAt: current?.createdAt || now,
  };
  await setDoc(ref, next);
  await logReadingEvent('verification_request', { ...book, bookId: fields.bookId }, { data: { method: next.method } });
  return { id: ref.id, ...next };
}

// ---------- bookmarks ----------
export async function isBookmarked(book) {
  if (!session.uid) return false;
  try {
    const snap = await getDoc(doc(db, 'bookmarks', `${session.uid}__${book.bookId || getBookId(book)}`));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function setBookmark(book, value) {
  requireUser();
  const fields = bookFields(book);
  const ref = doc(db, 'bookmarks', `${session.uid}__${fields.bookId}`);
  if (value) {
    await setDoc(ref, { uid: session.uid, ...fields, createdAt: new Date().toISOString() });
  } else {
    await deleteDoc(ref);
  }
  await logReadingEvent(value ? 'bookmark' : 'unbookmark', book);
  return value;
}

export async function getMyBookmarks() {
  if (!session.uid) return [];
  const snap = await getDocs(query(collection(db, 'bookmarks'), where('uid', '==', session.uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- my points / leaderboard / rewards ----------
export async function getMyLedger() {
  if (!session.uid) return [];
  const snap = await getDocs(query(collection(db, 'points_ledger'), where('uid', '==', session.uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMySummary() {
  const ledger = await getMyLedger();
  return { ledger, ...summarizeLedger(ledger) };
}

export async function getMyRewards() {
  if (!session.uid) return [];
  const snap = await getDocs(query(collection(db, 'reward_issues'), where('uid', '==', session.uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getLeaderboard() {
  const snap = await getDocs(collection(db, 'leaderboard'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setMyPrivacy(mode) {
  requireUser();
  const shortName = session.roster?.shortName || '';
  if (mode === 'short' && !shortName) fail('no_roster');
  // Preference is kept on the profile so later recalculations respect it.
  await setDoc(doc(db, 'users', session.uid), { privacyMode: mode, updatedAt: new Date().toISOString() }, { merge: true });
  const ref = doc(db, 'leaderboard', session.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return mode; // nothing public yet; applied on the next confirmation
  await setDoc(ref, { ...snap.data(), privacyMode: mode, nameShort: mode === 'hidden' ? '' : shortName });
  return mode;
}
