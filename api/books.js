import fs from 'fs';
import path from 'path';

let cachedBooks = null;
let lastMtime = 0;

function loadBooks() {
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'data', 'books.json'),
      path.join(process.cwd(), 'server', 'data', 'books.json'),
      path.join(process.cwd(), 'data', 'books.json'),
      path.join(process.cwd(), 'dist', 'data', 'books.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        if (!cachedBooks || stats.mtimeMs > lastMtime) {
          const raw = fs.readFileSync(p, 'utf-8');
          cachedBooks = JSON.parse(raw);
          lastMtime = stats.mtimeMs;
        }
        return cachedBooks;
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading books.json:', err.message);
  }
  if (!cachedBooks) cachedBooks = [];
  return cachedBooks;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const books = loadBooks();
  return res.status(200).json(books);
}
