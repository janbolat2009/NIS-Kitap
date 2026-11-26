// HTTP helpers for the API: errors, body parsing, input coercion, CORS and headers.

export class ApiError extends Error {
  constructor(status, code, extra = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function fail(status, code, extra) {
  throw new ApiError(status, code, extra);
}

const DEFAULT_ORIGINS = [
  'https://niskitap.site',
  'https://www.niskitap.site',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

function allowedOrigin(origin) {
  if (!origin) return '';
  const extra = String(process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if ([...DEFAULT_ORIGINS, ...extra].includes(origin)) return origin;
  // Preview deployments of this Vercel project.
  if (/^https:\/\/nis-kitap(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) return origin;
  return '';
}

export function setCommonHeaders(req, res) {
  const origin = allowedOrigin(req.headers?.origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function send(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

const MAX_BODY = 200 * 1024;

export function parseBody(req) {
  let body = req.body;
  if (body == null || body === '') return {};
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (body.length > MAX_BODY) fail(413, 'payload_too_large');
    try {
      body = JSON.parse(body);
    } catch {
      fail(400, 'invalid_json');
    }
  }
  if (typeof body !== 'object' || Array.isArray(body)) fail(400, 'invalid_body');
  if (JSON.stringify(body).length > MAX_BODY) fail(413, 'payload_too_large');
  return body;
}

// ---------- input coercion ----------
export function str(value, { max = 200, min = 0, field = 'value', required = false } = {}) {
  // eslint-disable-next-line no-control-regex
  const s = String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (required && !s) fail(400, 'missing_field', { field });
  if (s.length < min) fail(400, 'too_short', { field });
  if (s.length > max) fail(400, 'too_long', { field });
  return s;
}

export function int(value, { min = -Infinity, max = Infinity, field = 'value' } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) fail(400, 'bad_number', { field });
  return n;
}

export function oneOf(value, list, field = 'value') {
  if (!list.includes(value)) fail(400, 'bad_value', { field });
  return value;
}

export function id(value, field = 'id') {
  const s = String(value || '');
  if (!/^[A-Za-z0-9_\-.]{1,160}$/.test(s) || s.includes('..')) fail(400, 'bad_id', { field });
  return s;
}

export function bool(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}
