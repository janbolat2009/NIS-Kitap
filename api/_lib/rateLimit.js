// Fixed-window rate limits stored in Firestore (rate_limits/{key}), so they hold
// across serverless instances. Not readable or writable by clients.
import { db } from './admin.js';
import { fail } from './http.js';

export async function rateLimit(key, { limit, windowSec }) {
  const id = String(key).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 300);
  const ref = db().collection('rate_limits').doc(id);
  const now = Date.now();
  const result = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let count = 0;
    let windowStart = now;
    if (snap.exists) {
      const d = snap.data();
      if (now - Number(d.windowStart || 0) < windowSec * 1000) {
        count = Number(d.count) || 0;
        windowStart = Number(d.windowStart);
      }
    }
    if (count >= limit) {
      return { allowed: false, retryAfter: Math.ceil((windowStart + windowSec * 1000 - now) / 1000) };
    }
    tx.set(ref, { count: count + 1, windowStart, expiresAt: new Date(windowStart + windowSec * 1000) });
    return { allowed: true, remaining: limit - count - 1, resetAt: new Date(windowStart + windowSec * 1000).toISOString() };
  });
  if (!result.allowed) fail(429, 'rate_limited', { retryAfter: result.retryAfter });
  return result;
}
