// Reading points: formula, ledger entries, periods, rankings and anti-abuse checks.
// Pure functions only, so the same logic is unit-tested and used by the admin UI.
// Reading points are NOT school grades and are never written to any grade record.

export const DEFAULT_POINT_SETTINGS = Object.freeze({
  confirmedBook: 100,
  hundredBonus: 25,
  meaningfulReview: 20,
  // Share of the base points for a book the student already had confirmed before
  // (another edition / a re-read). 0 means a re-read gives no points.
  rereadShare: 0,
  milestones: [10, 25, 50, 75, 100],
  minReviewLength: 120,
});

export function normalizeSettings(raw = {}) {
  const s = { ...DEFAULT_POINT_SETTINGS, ...(raw || {}) };
  const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v)) : d);
  return {
    confirmedBook: num(s.confirmedBook, DEFAULT_POINT_SETTINGS.confirmedBook),
    hundredBonus: num(s.hundredBonus, DEFAULT_POINT_SETTINGS.hundredBonus),
    meaningfulReview: num(s.meaningfulReview, DEFAULT_POINT_SETTINGS.meaningfulReview),
    rereadShare: Math.min(1, Math.max(0, Number(s.rereadShare) || 0)),
    milestones: (Array.isArray(s.milestones) ? s.milestones : DEFAULT_POINT_SETTINGS.milestones)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b),
    minReviewLength: num(s.minReviewLength, DEFAULT_POINT_SETTINGS.minReviewLength),
  };
}

// ---------- periods ----------
// School year runs 1 September → 31 August. Terms (четверти):
// Q1 Sep–Oct, Q2 Nov–Dec, Q3 Jan–Mar, Q4 Apr–Aug.
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function academicYearOf(value) {
  const d = toDate(value);
  if (!d) return '';
  const y = d.getFullYear();
  return d.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function quarterOf(value) {
  const d = toDate(value);
  if (!d) return '';
  const m = d.getMonth();
  let q = 4;
  if (m === 8 || m === 9) q = 1;
  else if (m === 10 || m === 11) q = 2;
  else if (m <= 2) q = 3;
  return `${academicYearOf(d)}-Q${q}`;
}

export function monthOf(value) {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function periodKeys(value) {
  return { month: monthOf(value), quarter: quarterOf(value), academicYear: academicYearOf(value) };
}

// ---------- ledger ----------
// Ledger document IDs are deterministic. A second attempt to credit the same
// event produces the same ID; Firestore rules forbid overwriting ledger docs,
// so the same event can never be counted twice.
export function ledgerId(kind, sourceId) {
  return `${kind}__${String(sourceId).replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

export function isMeaningfulReview(text, settings = DEFAULT_POINT_SETTINGS) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length < settings.minReviewLength) return false;
  const words = clean.split(' ').filter((w) => w.length > 1);
  const unique = new Set(words.map((w) => w.toLowerCase()));
  return words.length >= 15 && unique.size / words.length > 0.45;
}

/**
 * Ledger entries created when a librarian confirms a reading.
 * @param progress  { id, uid, bookId, isHundred }
 * @param options   { settings, actorUid, now, reviewAccepted, alreadyConfirmedBookIds }
 */
export function entriesForConfirmation(progress, options = {}) {
  const settings = normalizeSettings(options.settings);
  const now = toDate(options.now) || new Date();
  const periods = periodKeys(now);
  const base = {
    uid: progress.uid,
    sourceType: 'reading_progress',
    sourceId: progress.id,
    bookId: progress.bookId || '',
    createdBy: options.actorUid || '',
    createdAt: now.toISOString(),
    ...periods,
  };
  const reread = Array.isArray(options.alreadyConfirmedBookIds) && options.alreadyConfirmedBookIds.includes(progress.bookId);
  const bookPoints = reread ? Math.round(settings.confirmedBook * settings.rereadShare) : settings.confirmedBook;

  const entries = [
    { ...base, id: ledgerId('book', progress.id), kind: 'book', points: bookPoints, reason: reread ? 'reread_confirmed' : 'book_confirmed' },
  ];
  if (progress.isHundred && !reread && settings.hundredBonus > 0) {
    entries.push({ ...base, id: ledgerId('hundred', progress.id), kind: 'hundred', points: settings.hundredBonus, reason: 'hundred_books_bonus' });
  }
  if (options.reviewAccepted && settings.meaningfulReview > 0) {
    entries.push({ ...base, id: ledgerId('review', progress.id), kind: 'review', points: settings.meaningfulReview, reason: 'meaningful_review' });
  }
  return entries;
}

export function milestoneEntries(uid, confirmedCount, existingIds = new Set(), options = {}) {
  const settings = normalizeSettings(options.settings);
  const now = toDate(options.now) || new Date();
  return settings.milestones
    .filter((m) => confirmedCount >= m)
    .map((m) => ({
      id: ledgerId('badge', `${uid}_${m}`),
      uid,
      kind: 'badge',
      badge: `books_${m}`,
      points: 0,
      reason: `milestone_${m}`,
      sourceType: 'milestone',
      sourceId: `${uid}_${m}`,
      createdBy: options.actorUid || '',
      createdAt: now.toISOString(),
      ...periodKeys(now),
    }))
    .filter((e) => !existingIds.has(e.id));
}

// Drop entries that already exist (idempotent re-run of the same confirmation).
export function onlyNewEntries(entries, existingIds) {
  const seen = new Set(existingIds);
  return entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function summarizeLedger(entries = []) {
  const summary = { total: 0, byPeriod: {}, badges: [], confirmedBooks: 0, hundredBooks: 0 };
  const seen = new Set();
  for (const e of entries) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    const pts = Number(e.points) || 0;
    summary.total += pts;
    for (const key of [e.month, e.quarter, e.academicYear]) {
      if (key) summary.byPeriod[key] = (summary.byPeriod[key] || 0) + pts;
    }
    if (e.kind === 'badge' && e.badge) summary.badges.push(e.badge);
    if (e.kind === 'book') summary.confirmedBooks += 1;
    if (e.kind === 'hundred') summary.hundredBooks += 1;
  }
  summary.badges.sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
  return summary;
}

// ---------- rankings ----------
export function rankRows(rows, valueOf) {
  const sorted = [...rows]
    .map((row) => ({ row, value: Number(valueOf(row)) || 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  let rank = 0;
  let prev = null;
  return sorted.map((item, index) => {
    if (item.value !== prev) {
      rank = index + 1;
      prev = item.value;
    }
    return { ...item.row, rank, score: item.value };
  });
}

export function groupTotals(rows, groupKey, labelKey) {
  const groups = new Map();
  for (const row of rows) {
    const key = row[groupKey];
    if (!key) continue;
    const g = groups.get(key) || { id: key, name: row[labelKey] || key, points: 0, confirmedBooks: 0, members: 0 };
    g.points += Number(row.periodScore ?? row.points) || 0;
    g.confirmedBooks += Number(row.confirmedBooks) || 0;
    g.members += 1;
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ ...g, perStudent: g.members ? Math.round(g.points / g.members) : 0 }));
}

// ---------- public names ----------
// «Аманова Адема» → «А. Адема». Never exposes the full surname or the email.
export function shortPublicName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const [surname, name] = parts;
  return `${surname.charAt(0).toUpperCase()}. ${name}`;
}

export function publicLabel(row, hiddenLabel = '—') {
  if (!row || row.privacyMode === 'hidden' || !row.nameShort) return hiddenLabel;
  return row.className ? `${row.nameShort}, ${row.className}` : row.nameShort;
}

// ---------- anti-abuse ----------
const DAY = 24 * 60 * 60 * 1000;

/**
 * Flags a verification request for manual review.
 * @param request  { uid, review, requestedAt, bookId }
 * @param history  all requests of the same student
 */
export function suspiciousFlags(request, history = [], settings = DEFAULT_POINT_SETTINGS) {
  const flags = [];
  const at = toDate(request.requestedAt) || new Date();
  const sameDay = history.filter((h) => {
    const t = toDate(h.requestedAt);
    return t && Math.abs(at - t) < DAY;
  });
  if (sameDay.length > 5) flags.push('many_requests_24h');
  const review = String(request.review || '').trim().toLowerCase();
  if (review && review.length < 40) flags.push('short_review');
  if (review) {
    const duplicates = history.filter((h) => h.id !== request.id && String(h.review || '').trim().toLowerCase() === review);
    if (duplicates.length) flags.push('duplicate_review');
  }
  if (request.startedAt) {
    const started = toDate(request.startedAt);
    if (started && at - started < 60 * 60 * 1000 && !request.loanReturned) flags.push('finished_too_fast');
  }
  if (settings && review && !isMeaningfulReview(review, normalizeSettings(settings)) && review.length >= 40) {
    flags.push('review_not_meaningful');
  }
  return flags;
}
