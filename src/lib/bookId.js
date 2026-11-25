// Stable book identifiers.
// The catalog (public/data/books.json) has no numeric IDs, so every book gets a
// deterministic ID derived from its normalized title, author and language.
// The same function runs in the browser, in build scripts and in tests, so a
// book always resolves to the same ID and the 100-books list can link to the
// catalog without creating duplicates.

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"“”„'’`´]/g, '')
    .replace(/[.,:;!?()[\]{}/\\|–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function getBookId(book) {
  if (!book) return '';
  if (book.id && /^bk_[0-9a-f]{8}$/.test(book.id)) return book.id;
  const key = [normalizeText(book.title), normalizeText(book.author), normalizeText(book.language)].join('|');
  return `bk_${fnv1a(key)}`;
}

// Tokens used to compare authors written as «Б. Соқпақбаев»,
// «Соқпақбаев Бердібек» or «Jack London».
export function authorTokens(author) {
  return normalizeText(author)
    .split(' ')
    .filter((part) => part.length > 2);
}

export function authorsMatch(a, b) {
  const ta = authorTokens(a);
  const tb = authorTokens(b);
  if (!ta.length || !tb.length) return false;
  return ta.some((token) => tb.some((other) => other === token || other.startsWith(token) || token.startsWith(other)));
}
