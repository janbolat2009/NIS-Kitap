// The «100 кітап» list (public/data/hundred-books.json). No Firestore here, so
// the home page can show the list size without loading the Firestore SDK.
// Re-exported from services/library.js for the pages that already import it there.
let hundredCache = null;
export async function loadHundredBooks() {
  if (hundredCache) return hundredCache;
  const res = await fetch('/data/hundred-books.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('hundred_books_unavailable');
  hundredCache = await res.json();
  return hundredCache;
}
