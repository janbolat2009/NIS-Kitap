// Fund and reservation rules shared by the server API, the UI and the tests.
//
// Terms (shown the same way everywhere in the interface):
//   total     — всего экземпляров в фонде
//   held      — зарезервировано: удерживается бронью, ждёт выдачи
//   issued    — выдано: книга у читателя
//   available — свободно = total − held − issued (никогда не меньше нуля)
//
// Life cycle of a reservation:
//   requested → ready (librarian prepared it, pickup time set, e-mail sent)
//             → issued (librarian handed the copy over) → returned
//   requested/ready → cancelled (reader or librarian) | expired (hold time passed)
// A reservation holds one copy (held + 1) but is NOT counted as issued until the
// librarian confirms the hand-over.

export const STATUSES = ['requested', 'ready', 'issued', 'returned', 'cancelled', 'expired'];
export const HOLDING = ['requested', 'ready'];
export const OPEN = ['requested', 'ready', 'issued'];
export const FINAL = ['returned', 'cancelled', 'expired'];

// Records written by the previous version of the site.
const LEGACY = { active: 'requested' };

export function normalizeStatus(status) {
  return LEGACY[status] || (STATUSES.includes(status) ? status : 'requested');
}

const TRANSITIONS = {
  requested: ['ready', 'issued', 'cancelled', 'expired'],
  ready: ['ready', 'issued', 'cancelled', 'expired'],
  issued: ['returned'],
  returned: [],
  cancelled: [],
  expired: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[normalizeStatus(from)] || []).includes(to);
}

export function availability(inv = {}) {
  const total = Math.max(0, Number(inv.total) || 0);
  const held = Math.max(0, Number(inv.held) || 0);
  const issued = Math.max(0, Number(inv.issued) || 0);
  return { total, held, issued, available: Math.max(0, total - held - issued) };
}

/**
 * Applies a change to the counters and refuses any change that would make a
 * counter negative or put more copies in use than the fund has.
 */
export function applyDelta(inv, delta = {}) {
  const cur = availability(inv);
  const next = {
    total: cur.total + (Number(delta.total) || 0),
    held: cur.held + (Number(delta.held) || 0),
    issued: cur.issued + (Number(delta.issued) || 0),
  };
  if (next.total < 0 || next.held < 0 || next.issued < 0) {
    const err = new Error('negative_stock');
    err.code = 'negative_stock';
    throw err;
  }
  if (next.held + next.issued > next.total) {
    const err = new Error('no_copies');
    err.code = 'no_copies';
    throw err;
  }
  return { ...next, available: next.total - next.held - next.issued };
}

export function deltaFor(from, to) {
  const f = normalizeStatus(from);
  const holdingBefore = HOLDING.includes(f);
  if (to === 'issued') return holdingBefore ? { held: -1, issued: 1 } : { issued: 1 };
  if (to === 'returned') return f === 'issued' ? { issued: -1 } : {};
  if (to === 'cancelled' || to === 'expired') return holdingBefore ? { held: -1 } : {};
  return {};
}

export function isHoldExpired(reservation, now = new Date()) {
  if (!HOLDING.includes(normalizeStatus(reservation?.status))) return false;
  const until = reservation.holdUntil ? new Date(reservation.holdUntil) : null;
  return Boolean(until && !Number.isNaN(until.getTime()) && until.getTime() < now.getTime());
}

export function addHours(date, hours) {
  return new Date(new Date(date).getTime() + Number(hours) * 3600 * 1000);
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function reservationCode(random = Math.random) {
  let tail = '';
  for (let i = 0; i < 6; i += 1) tail += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return `NK-${tail}`;
}

export function isValidPickup(p = {}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''));
  const time = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || ''));
  const place = String(p.place || '').trim().length >= 2 && String(p.place || '').length <= 120;
  return date && time(p.from) && time(p.to) && String(p.from) < String(p.to) && place;
}
