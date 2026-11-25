// Server-side verification of Firebase ID tokens for Vercel functions.
// Uses Google's public signing certificates — no service-account secret needed.
// Files under api/_lib are not exposed as routes by Vercel.
import jwt from 'jsonwebtoken';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'nis-kitap-2025';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = { certs: null, expiresAt: 0 };

async function getCerts() {
  if (certCache.certs && Date.now() < certCache.expiresAt) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error('certs_unavailable');
  const certs = await res.json();
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  certCache = { certs, expiresAt: Date.now() + maxAge * 1000 };
  return certs;
}

export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(header));
  return m ? m[1].trim() : '';
}

/**
 * Returns { uid, email, emailVerified, name } or throws.
 */
export async function verifyFirebaseToken(token) {
  if (!token) throw new Error('missing_token');
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid) throw new Error('bad_token');
  const certs = await getCerts();
  const cert = certs[kid];
  if (!cert) throw new Error('unknown_key');
  const payload = jwt.verify(token, cert, {
    algorithms: ['RS256'],
    audience: PROJECT_ID,
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
  });
  if (!payload.sub) throw new Error('bad_token');
  return {
    uid: payload.sub,
    email: String(payload.email || '').toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name || '',
  };
}

export async function requireUser(req, res) {
  try {
    return await verifyFirebaseToken(bearerToken(req));
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Sign in again to continue.' });
    return null;
  }
}
