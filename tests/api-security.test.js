import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// The real verifier checks Google-signed JWTs; here it is replaced so tests do not hit the network.
vi.mock('../api/_lib/firebaseAuth.js', () => ({
  bearerToken: (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
  verifyFirebaseToken: async (token) => {
    if (token === 'valid-student') return { uid: 'u1', email: 'pupil@school.kz', emailVerified: true, name: 'Pupil' };
    throw new Error('bad_token');
  },
  requireUser: async (req, res) => {
    if (req.headers.authorization === 'Bearer valid-student') return { uid: 'u1', email: 'pupil@school.kz', emailVerified: true, name: 'Pupil' };
    res.status(401).json({ error: 'unauthorized' });
    return null;
  },
}));

function mockRes() {
  const res = { statusCode: 200, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.end = () => res;
  return res;
}

const catalogTitles = new Set(
  JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/data/books.json'), 'utf8')).map((b) => b.title),
);

describe('AI search API', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;
  });

  it('rejects requests without a verified token even if an email is supplied', async () => {
    const { default: handler } = await import('../api/gemini/search.js');
    const res = mockRes();
    await handler({ method: 'POST', headers: { 'x-user-email': 'someone@school.kz' }, body: { prompt: 'Абай', userEmail: 'someone@school.kz' } }, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns only books that exist in the NIS Kitap catalog', async () => {
    const { default: handler } = await import('../api/gemini/search.js');
    const res = mockRes();
    await handler({ method: 'POST', headers: { authorization: 'Bearer valid-student' }, body: { prompt: 'Қазақ тарихы туралы кітап' } }, res);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    for (const b of res.body.books) expect(catalogTitles.has(b.title)).toBe(true);
  });
});

describe('API v2 routing without server credentials', () => {
  const call = async (method, path, headers = {}) => {
    const { default: handler } = await import('../api/v2/index.js');
    const res = mockRes();
    let raw = '';
    res.end = (chunk) => { raw = chunk || ''; return res; };
    await handler({ method, url: `/api/v2/${path}`, headers, query: { path } }, res);
    return { status: res.statusCode, body: raw ? JSON.parse(raw) : null, headers: res.headers };
  };

  it('never runs a protected action when the server has no Firebase credentials', async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    const r = await call('POST', 'reservations', { authorization: 'Bearer x' });
    expect(r.status).toBe(503);
    expect(r.body.error).toBe('server_not_configured');
    const health = await call('GET', 'health');
    expect(health.body.data.adminConfigured).toBe(false);
  });

  it('answers CORS only for the school site and local development', async () => {
    const own = await call('OPTIONS', 'health', { origin: 'https://www.niskitap.site' });
    expect(own.headers['Access-Control-Allow-Origin']).toBe('https://www.niskitap.site');
    const evil = await call('OPTIONS', 'health', { origin: 'https://evil.example' });
    expect(evil.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('rejects unknown routes and wrong methods', async () => {
    expect((await call('GET', 'nope')).status).toBe(404);
    expect((await call('GET', 'reservations')).status).toBe(405);
  });
});
