import fs from 'fs';
import path from 'path';

let cachedBooks = null;

function loadBooks() {
  if (cachedBooks) return cachedBooks;
  try {
    const candidates = [
      path.join(process.cwd(), 'public', 'data', 'books.json'),
      path.join(process.cwd(), 'data', 'books.json'),
      path.join(process.cwd(), 'server', 'data', 'books.json'),
      path.join(process.cwd(), 'dist', 'data', 'books.json'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedBooks = JSON.parse(raw);
        return cachedBooks;
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading books.json:', err.message);
  }
  cachedBooks = [];
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
