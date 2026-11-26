// «Похожие книги» on the book page. Pure function over the real catalog list:
// no invented books, the open book is never included.
//
// Order:
//   1. books that share a genre with the open book
//      (more shared genres first, then the same language);
//   2. if there are not enough, books in the same language;
//   inside every group a book with free copies comes before a book without,
//   then by title so the list is stable between visits.
import { getBookId } from './bookId.js';
import { matchGenre } from '../config/genres.js';

// Placeholder genre given to records without one (see bookService.mapBookRecord).
const NO_GENRE = new Set(['другое', 'other', '']);

const genresOf = (book) => (Array.isArray(book?.genre) ? book.genre : [book?.genre])
  .map((g) => String(g || '').trim())
  .filter((g) => !NO_GENRE.has(g.toLowerCase()));

const isAvailable = (book) => Number(book?.copies) > 0;
const sameText = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export function similarBooks(current, books, {
  limit = 6,
  normalizeLanguage = (lang) => String(lang || '').trim().toLowerCase(),
} = {}) {
  if (!current || !Array.isArray(books) || !books.length) return [];
  const currentId = getBookId(current);
  const currentGenres = genresOf(current);
  const currentLang = normalizeLanguage(current.language);

  const byGenre = [];
  const byLanguage = [];
  for (const book of books) {
    if (!book || book.visible === false) continue;
    if (book === current || getBookId(book) === currentId || sameText(book.title, current.title)) continue;
    const shared = currentGenres.length ? currentGenres.filter((g) => matchGenre(genresOf(book), g)).length : 0;
    const sameLang = Boolean(currentLang) && normalizeLanguage(book.language) === currentLang;
    if (shared > 0) byGenre.push({ book, shared, sameLang });
    else if (sameLang) byLanguage.push({ book, shared, sameLang });
  }

  const byTitle = (a, b) => String(a.book.title || '').localeCompare(String(b.book.title || ''), 'ru');
  const byAvailability = (a, b) => Number(isAvailable(b.book)) - Number(isAvailable(a.book));
  byGenre.sort((a, b) => (b.shared - a.shared) || (Number(b.sameLang) - Number(a.sameLang)) || byAvailability(a, b) || byTitle(a, b));
  byLanguage.sort((a, b) => byAvailability(a, b) || byTitle(a, b));

  const seen = new Set();
  const out = [];
  for (const { book } of [...byGenre, ...byLanguage]) {
    const id = getBookId(book);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(book);
    if (out.length >= limit) break;
  }
  return out;
}
