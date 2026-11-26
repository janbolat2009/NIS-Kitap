// Display helpers for reading verification and reward statuses, and the
// certificate number format. The transitions themselves are enforced by the
// server API (api/_lib/domain/reading.js, rewards.js).

// ---------- reading ----------
// status: want | reading | finished
// verificationStatus: none | pending | confirmed | rejected | revoked
export const READING_STATUSES = ['want', 'reading', 'finished'];

export function displayStatus(progress) {
  if (!progress) return 'not_started';
  const v = progress.verificationStatus;
  if (v === 'confirmed') return 'confirmed';
  if (v === 'pending') return 'pending';
  if (v === 'rejected' || v === 'revoked') return v;
  if (progress.status === 'reading') return 'reading';
  if (progress.status === 'want') return 'want';
  if (progress.status === 'finished') return 'finished';
  return 'not_started';
}

// ---------- rewards ----------
export const REWARD_TYPES = ['certificate', 'diploma', 'achievement', 'prize', 'other'];
export const REWARD_ISSUE_STATUSES = ['requested', 'pending_approval', 'issued', 'rejected', 'revoked'];

// ---------- certificates ----------
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function certificateNumber(date = new Date(), random = Math.random) {
  let tail = '';
  for (let i = 0; i < 8; i += 1) tail += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `NISK-${date.getFullYear()}-${tail}`;
}

export function isValidCertificateNumber(value) {
  return /^NISK-\d{4}-[A-HJ-NP-Z2-9]{8}$/.test(String(value || ''));
}
