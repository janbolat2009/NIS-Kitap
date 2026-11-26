// Local server for the Vercel functions in api/ (port 3001, used by the Vite proxy).
// Run against the emulators only:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
//   GCLOUD_PROJECT=demo-niskitap FIREBASE_PROJECT_ID=demo-niskitap node scripts/dev-api.mjs
import http from 'node:http';
import { fileURLToPath } from 'node:url';

// The handlers read public/data/*.json relative to the project folder.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const handlers = {
  '/api/v2': (await import('../api/v2/index.js')).default,
  '/api/books': (await import('../api/books.js')).default,
  '/api/gemini/search': (await import('../api/gemini/search.js')).default,
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let body = '';
  for await (const chunk of req) body += chunk;
  const key = Object.keys(handlers).find((k) => url.pathname === k || url.pathname.startsWith(`${k}/`));
  if (!key) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  req.query = Object.fromEntries(url.searchParams);
  if (key === '/api/v2') req.query.path = url.pathname.slice('/api/v2/'.length);
  req.body = body;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return res; };
  try {
    await handlers[key](req, res);
  } catch (err) {
    console.error(err);
    if (!res.writableEnded) res.status(500).json({ error: 'internal_error' });
  }
}).listen(3001, () => console.log('api on http://localhost:3001'));
