// Read-only access to the static catalog (public/data/books.json) and the
// 100 kitap list (public/data/hundred-books.json) on the server. Used to check
// that a book really exists and to take its title and number of copies from a
// trusted source instead of the request body.
import fs from 'node:fs';
import path from 'node:path';
import { getBookId } from '../../src/lib/bookId.js';

let books = null;
let hundred = null;

function readJson(file) {
  const candidates = [
    path.join(process.cwd(), 'public', 'data', file),
    path.join(process.cwd(), 'dist', 'data', file),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return null;
}

function loadBooks() {
  if (books) return books;
  const list = readJson('books.json') || [];
  books = new Map();
  for (const b of list) {
    const bookId = getBookId(b);
    if (!books.has(bookId)) {
      books.set(bookId, {
        bookId,
        title: String(b.title || '').slice(0, 300),
        author: String(b.author || '').slice(0, 200),
        language: b.language || '',
        genre: Array.isArray(b.genre) ? b.genre[0] || '' : b.genre || '',
        copies: Math.max(0, Number(b.copies ?? 0) || 0),
        visible: b.visible !== false,
      });
    }
  }
  return books;
}

function loadHundred() {
  if (hundred) return hundred;
  const data = readJson('hundred-books.json') || { books: [] };
  hundred = new Map((data.books || []).map((h) => [h.id, h]));
  return hundred;
}

export function catalogBook(bookId) {
  return loadBooks().get(String(bookId || '')) || null;
}

export function hundredEntry(hundredId) {
  return loadHundred().get(String(hundredId || '')) || null;
}

export function hundredByCatalogId(bookId) {
  for (const h of loadHundred().values()) {
    if (h.catalogBookId === bookId) return h;
  }
  return null;
}

/**
 * Resolves a book a student wants to track. A book of the 100 kitap list that is
 * not in the catalog gets the id `h100_xxx` and can be tracked, but never
 * reserved (there is nothing on the shelf to hold).
 */
export function resolveTrackable(bookId, hundredId) {
  const fromCatalog = catalogBook(bookId);
  if (fromCatalog) {
    const h = hundredId ? hundredEntry(hundredId) : hundredByCatalogId(fromCatalog.bookId);
    const isHundred = Boolean(h && (!hundredId || h.catalogBookId === fromCatalog.bookId || h.id === hundredId));
    return { ...fromCatalog, inCatalog: true, isHundred, hundredId: isHundred ? h.id : '' };
  }
  const h = hundredEntry(hundredId || bookId);
  if (h && (bookId === h.id || bookId === h.catalogBookId || !bookId)) {
    return {
      bookId: h.catalogBookId || h.id,
      title: h.title,
      author: h.author,
      language: h.section === 'kazakh' ? 'Қазақ' : h.section === 'russian' ? 'Русский' : '',
      genre: h.genre || '',
      copies: 0,
      inCatalog: Boolean(h.catalogBookId && catalogBook(h.catalogBookId)),
      isHundred: true,
      hundredId: h.id,
    };
  }
  return null;
}
