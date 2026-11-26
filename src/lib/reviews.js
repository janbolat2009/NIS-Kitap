// Review validation shared by the server (authoritative) and the form (hints).
// Reviews are written by school students, so contact details are refused:
// links, e-mail addresses and phone numbers never get published.

export const REVIEW_LIMITS = Object.freeze({ minLength: 20, maxLength: 2000, writesPerDay: 5 });
export const REVIEW_STATUSES = ['pending', 'published', 'rejected'];

export function sanitizeReviewText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    // control characters except line breaks and tabs
    // eslint-disable-next-line no-control-regex, no-irregular-whitespace
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ru|kz|org|net|io|me|site|xyz|info|app|ly|gg)\b|t\.me\/|@[a-z0-9_]{4,})/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(\+?\d[\s()-]*){10,}/;
const REPEAT = /(.)\1{9,}/;

/**
 * @returns {{ ok: boolean, errors: string[], value: { rating: number, text: string } }}
 */
export function validateReview({ rating, text } = {}) {
  const errors = [];
  const clean = sanitizeReviewText(text);
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) errors.push('bad_rating');
  if (clean.length < REVIEW_LIMITS.minLength) errors.push('too_short');
  if (clean.length > REVIEW_LIMITS.maxLength) errors.push('too_long');
  if (EMAIL.test(clean)) errors.push('contains_email');
  else if (LINK.test(clean)) errors.push('contains_link');
  if (PHONE.test(clean)) errors.push('contains_phone');
  if (REPEAT.test(clean)) errors.push('spam');
  const letters = clean.replace(/[^\p{L}]/gu, '');
  if (letters.length >= 20 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) errors.push('all_caps');
  return { ok: errors.length === 0, errors, value: { rating: r, text: clean } };
}
