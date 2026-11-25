// Builds public/data/hundred-books.json from scripts/hundred-books.source.mjs
// and links each entry to an existing catalog record (by stable book ID).
// Usage: node scripts/build-hundred-books.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROWS, SOURCE } from './hundred-books.source.mjs';
import { getBookId, normalizeText, authorsMatch } from '../src/lib/bookId.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/data/books.json'), 'utf8'));

const SECTION_LANGUAGE = { kazakh: 'Қазақ', russian: 'Русский', foreign: null };

// Catalog records verified by hand: the work is held as part of a collected
// edition or under a different spelling. Keyed by list order → [catalog title, author fragment].
const MANUAL_LINKS = {
  22: ['Шығармалары. Т.1. Ұшқын. Қабеннің құбылысы', 'Қабдолов'],
  23: ['Бақытсыз Жамал / Қыз көрелік / Ақбілек', 'Дулатов'],
  40: ['Шығармаларының жиырма томдық толық жинағы. 1 том. Үркер', 'Кекілбаев'],
  41: ['Таңдамалы туындыларының көп томдығы. Т. 12. Жазмыш. Қасірет кітабы', 'Мырза Әли'],
  48: ['Шығармалар жинағы. Т.1. Әуелгі әңгімелер. Тазының өлімі. Қара қыз. Көк мұнар. Бір атаның балалары', 'Мағауин'],
  68: ['Человек-амфибия. Голова профессора Доуэля. Остров погибших кораблей', 'Беляев'],
  71: ['Завтра была война', 'Васильев'],
  89: ['Black Beauty', 'Sewell'],
  91: ['The Boy in the Striped Pajamas', 'Boyne'],
  92: ['451 градус по Фаренгейту. Механизмы радости', 'Брэдбери'],
  95: ['1984', 'Оруэлл'],
  100: ['Над пропастью во ржи', 'Сэлинджер'],
};

function findManualMatch(order) {
  const link = MANUAL_LINKS[order];
  if (!link) return null;
  const [title, authorPart] = link;
  const found = catalog.find((book) => book.title === title && String(book.author).includes(authorPart));
  if (!found) throw new Error(`Manual link for #${order} not found in catalog: ${title}`);
  return found;
}

function findCatalogMatch(entry) {
  const manual = findManualMatch(entry.order);
  if (manual) return manual;
  const titles = [entry.title, entry.titleAlt].filter(Boolean).map(normalizeText);
  const candidates = catalog.filter((book) => {
    const t = normalizeText(book.title);
    return titles.some((wanted) => t === wanted || (wanted.length > 5 && t.startsWith(wanted)));
  });
  const withAuthor = candidates.filter((book) => authorsMatch(entry.author, book.author));
  const pool = withAuthor.length ? withAuthor : [];
  if (!pool.length) return null;
  // Prefer visible records, then the language that matches the section.
  pool.sort((a, b) => {
    const visible = Number(b.visible !== false) - Number(a.visible !== false);
    if (visible) return visible;
    const lang = SECTION_LANGUAGE[entry.section];
    return Number(b.language === lang) - Number(a.language === lang);
  });
  return pool[0];
}

const books = ROWS.map(([order, section, grade, title, author, genre, titleAlt]) => {
  const entry = { order, section, grade, title, author, genre };
  if (titleAlt) entry.titleAlt = titleAlt;
  const match = findCatalogMatch(entry);
  return {
    id: `h100_${String(order).padStart(3, '0')}`,
    ...entry,
    catalogBookId: match ? getBookId(match) : null,
    catalogTitle: match ? match.title : null,
    catalogLanguage: match ? match.language : null,
    catalogCopies: match ? Number(match.copies ?? 0) : null,
    catalogVisible: match ? match.visible !== false : null,
    isActive: true,
  };
});

const ids = new Set(books.map((b) => b.id));
if (ids.size !== 100 || books.length !== 100) throw new Error('The list must contain exactly 100 unique entries');

const out = {
  source: SOURCE.document,
  projectTitle: SOURCE.projectTitle,
  generatedAt: new Date().toISOString().slice(0, 10),
  books,
};
fs.writeFileSync(path.join(root, 'public/data/hundred-books.json'), JSON.stringify(out, null, 2) + '\n');
const linked = books.filter((b) => b.catalogBookId).length;
console.log(`hundred-books.json: ${books.length} books, ${linked} linked to the catalog`);
for (const b of books.filter((x) => !x.catalogBookId)) console.log('  not in catalog:', b.order, b.title, '—', b.author);
