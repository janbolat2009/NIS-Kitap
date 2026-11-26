// Reading points: rules, ledger entries, periods and summaries.
// Pure functions shared by the server API (which alone writes the ledger),
// the UI and the unit tests. Reading points are not school grades.
//
// Ledger model (points_ledger/{id}):
//   one document per credited action, never deleted. A deterministic id
//   (`book__{progressId}`, `hundred__{progressId}` …) means the same confirmed
//   action can be credited only once. A mistaken entry is cancelled by a second
//   entry with the opposite sign (`reversal__{originalId}`); the original keeps
//   `reversed: true` so the history stays readable.
//   Every entry stores the student's class and shanyrak *at the time of the
//   action*, so moving a student later never changes past results.

export const ACTIONS = ['book_confirmed', 'hundred_bonus', 'review_accepted', 'milestone', 'reward', 'manual', 'reversal'];

export const DEFAULT_POINT_RULES = Object.freeze({
  bookConfirmed: 100,
  hundredBonus: 25,
  reviewAccepted: 20,
  milestones: [10, 25, 50, 75, 100],
  milestonePoints: 0,
  maxManualPoints: 500,
});

const num = (v, d, max = 100000) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(max, Math.round(n)) : d;
};

// Accepts the old setting names (confirmedBook, meaningfulReview) as well.
export function normalizeRules(raw = {}) {
  const r = raw || {};
  const d = DEFAULT_POINT_RULES;
  return {
    bookConfirmed: num(r.bookConfirmed ?? r.confirmedBook, d.bookConfirmed, 1000),
    hundredBonus: num(r.hundredBonus, d.hundredBonus, 1000),
    reviewAccepted: num(r.reviewAccepted ?? r.meaningfulReview, d.reviewAccepted, 1000),
    milestones: (Array.isArray(r.milestones) ? r.milestones : d.milestones)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0 && n <= 1000)
      .sort((a, b) => a - b)
      .filter((n, i, arr) => arr.indexOf(n) === i),
    milestonePoints: num(r.milestonePoints, d.milestonePoints, 1000),
    maxManualPoints: num(r.maxManualPoints, d.maxManualPoints, 5000),
  };
}
// Backward-compatible names used by older pages.
export const DEFAULT_POINT_SETTINGS = DEFAULT_POINT_RULES;
export const normalizeSettings = normalizeRules;

// ---------- periods ----------
// School year 1 September → 31 August. Quarters (четверти):
// Q1 Sep–Oct, Q2 Nov–Dec, Q3 Jan–Mar, Q4 Apr–Aug.
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
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

// Month keys ('YYYY-MM') that belong to a quarter key ('2026-2027-Q2').
export function monthsOfQuarter(quarterKey) {
  const m = /^(\d{4})-(\d{4})-Q([1-4])$/.exec(String(quarterKey || ''));
  if (!m) return [];
  const [start, end] = [Number(m[1]), Number(m[2])];
  const map = { 1: [[start, 9], [start, 10]], 2: [[start, 11], [start, 12]], 3: [[end, 1], [end, 2], [end, 3]], 4: [[end, 4], [end, 5], [end, 6], [end, 7], [end, 8]] };
  return map[m[3]].map(([y, mo]) => `${y}-${String(mo).padStart(2, '0')}`);
}

export function monthsOfAcademicYear(year) {
  const m = /^(\d{4})-(\d{4})$/.exec(String(year || ''));
  if (!m) return [];
  return [1, 2, 3, 4].flatMap((q) => monthsOfQuarter(`${year}-Q${q}`));
}

// ---------- ledger ----------
export function ledgerId(kind, sourceId) {
  return `${kind}__${String(sourceId).replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

// Entries written by the first version of the site used `kind` instead of `action`.
const LEGACY_KIND = { book: 'book_confirmed', hundred: 'hundred_bonus', review: 'review_accepted', badge: 'milestone', manual: 'manual', reward: 'reward' };
export function actionOf(entry) {
  if (!entry) return '';
  if (entry.action) return entry.action;
  return LEGACY_KIND[entry.kind] || entry.kind || '';
}

function snapshotFields(snapshot = {}) {
  return {
    academicYear: snapshot.academicYear || '',
    classId: snapshot.classId || '',
    className: snapshot.className || '',
    shanyrakId: snapshot.shanyrakId || '',
    shanyrakName: snapshot.shanyrakName || '',
  };
}

/**
 * Ledger entries for a reading confirmed by a librarian.
 * @param progress { id, uid, bookId, bookTitle, isHundred }
 * @param options  { rules, reviewAccepted, snapshot, actor: {uid, role}, now }
 */
export function entriesForConfirmation(progress, options = {}) {
  const rules = normalizeRules(options.rules);
  const now = toDate(options.now) || new Date();
  const actor = options.actor || {};
  const base = {
    uid: progress.uid,
    sourceType: 'reading_progress',
    sourceId: progress.id,
    bookId: progress.bookId || '',
    bookTitle: String(progress.bookTitle || '').slice(0, 300),
    createdAt: now.toISOString(),
    createdBy: actor.uid || '',
    createdByRole: actor.role || '',
    ...periodKeys(now),
    ...snapshotFields(options.snapshot),
    reversed: false,
  };
  if (options.snapshot?.academicYear) base.academicYear = options.snapshot.academicYear;
  const entries = [{ ...base, id: ledgerId('book', progress.id), action: 'book_confirmed', points: rules.bookConfirmed, rule: 'bookConfirmed' }];
  if (progress.isHundred && rules.hundredBonus > 0) {
    entries.push({ ...base, id: ledgerId('hundred', progress.id), action: 'hundred_bonus', points: rules.hundredBonus, rule: 'hundredBonus' });
  }
  if (options.reviewAccepted && rules.reviewAccepted > 0) {
    entries.push({ ...base, id: ledgerId('review', progress.id), action: 'review_accepted', points: rules.reviewAccepted, rule: 'reviewAccepted' });
  }
  return entries;
}

// Milestone badges reached with this confirmation (confirmedCount includes it).
export function milestoneEntries(uid, confirmedCount, options = {}) {
  const rules = normalizeRules(options.rules);
  const now = toDate(options.now) || new Date();
  const actor = options.actor || {};
  return rules.milestones
    .filter((m) => confirmedCount === m)
    .map((m) => ({
      id: ledgerId('badge', `${uid}_${m}`),
      uid,
      action: 'milestone',
      badge: `books_${m}`,
      points: rules.milestonePoints,
      rule: 'milestonePoints',
      sourceType: 'milestone',
      sourceId: `${uid}_${m}`,
      createdAt: now.toISOString(),
      createdBy: actor.uid || '',
      createdByRole: actor.role || '',
      ...periodKeys(now),
      ...snapshotFields(options.snapshot),
      reversed: false,
    }));
}

// The entry that cancels another one. Attributed to the same period, class and
// shanyrak as the original, so the original contribution is removed exactly.
export function reversalEntry(original, { actor = {}, reason = '', now = new Date() } = {}) {
  return {
    id: ledgerId('reversal', original.id),
    uid: original.uid,
    action: 'reversal',
    points: -(Number(original.points) || 0),
    reversalOf: original.id,
    reversedAction: actionOf(original),
    bookId: original.bookId || '',
    bookTitle: original.bookTitle || '',
    sourceType: 'points_ledger',
    sourceId: original.id,
    reason: String(reason || '').slice(0, 300),
    createdAt: (toDate(now) || new Date()).toISOString(),
    createdBy: actor.uid || '',
    createdByRole: actor.role || '',
    month: original.month || monthOf(original.createdAt),
    quarter: original.quarter || quarterOf(original.createdAt),
    academicYear: original.academicYear || academicYearOf(original.createdAt),
    classId: original.classId || '',
    className: original.className || '',
    shanyrakId: original.shanyrakId || '',
    shanyrakName: original.shanyrakName || '',
    reversed: false,
  };
}

// Kind key used in aggregates: book, hundred, review, milestone, reward, manual, reversal.
export function aggregateKey(entry) {
  const a = actionOf(entry);
  return { book_confirmed: 'book', hundred_bonus: 'hundred', review_accepted: 'review' }[a] || a || 'other';
}

/**
 * Student summary from the ledger.
 */
export function summarizeLedger(entries = []) {
  const summary = { total: 0, byYear: {}, byPeriod: {}, byAction: {}, badges: [], confirmedBooks: 0, hundredBooks: 0 };
  const seen = new Set();
  const reversedIds = new Set(entries.filter((e) => actionOf(e) === 'reversal').map((e) => e.reversalOf));
  for (const e of entries) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    const pts = Number(e.points) || 0;
    const action = actionOf(e);
    summary.total += pts;
    summary.byAction[action] = (summary.byAction[action] || 0) + pts;
    for (const key of [e.month, e.quarter, e.academicYear]) {
      if (key) summary.byPeriod[key] = (summary.byPeriod[key] || 0) + pts;
    }
    if (e.academicYear) summary.byYear[e.academicYear] = (summary.byYear[e.academicYear] || 0) + pts;
    const cancelled = reversedIds.has(e.id) || e.reversed === true;
    if (action === 'milestone' && e.badge && !cancelled) summary.badges.push(e.badge);
    if (action === 'book_confirmed' && !cancelled) summary.confirmedBooks += 1;
    if (action === 'hundred_bonus' && !cancelled) summary.hundredBooks += 1;
  }
  summary.badges.sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
  return summary;
}

// ---------- shanyrak aggregates ----------
// shanyrak_points/{year__slug}.months['YYYY-MM'] = { total, book, hundred, … }
// classes['10A'] = total. Sums months that belong to the chosen period.
export function shanyrakPeriodTotals(doc, period = {}) {
  const months = doc?.months || {};
  let keys = Object.keys(months);
  if (period.month) keys = keys.filter((k) => k === period.month);
  else if (period.quarter) keys = keys.filter((k) => monthsOfQuarter(period.quarter).includes(k));
  const out = { total: 0, byKind: {}, byClass: {} };
  for (const k of keys) {
    const m = months[k] || {};
    for (const [field, value] of Object.entries(m)) {
      if (field === 'classes') {
        for (const [cls, v] of Object.entries(value || {})) out.byClass[cls] = (out.byClass[cls] || 0) + (Number(v) || 0);
      } else if (field === 'total') {
        out.total += Number(value) || 0;
      } else {
        out.byKind[field] = (out.byKind[field] || 0) + (Number(value) || 0);
      }
    }
  }
  return out;
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
