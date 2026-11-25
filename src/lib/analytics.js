// Aggregations for /admin/analytics. Everything is computed from real records
// (reading events, progress, reservations, roster); nothing is simulated.
import { toDate, monthOf, academicYearOf, quarterOf } from './points.js';

const DAY = 24 * 60 * 60 * 1000;

export const EVENT_TYPES = ['view', 'bookmark', 'reservation', 'issue', 'return', 'verification_request', 'confirmed', 'rejected'];

export function periodRange(period, now = new Date()) {
  const end = new Date(now);
  switch (period) {
    case 'week':
      return { from: new Date(end - 7 * DAY), to: end };
    case 'month':
      return { from: new Date(end - 30 * DAY), to: end };
    case 'quarter': {
      const key = quarterOf(end);
      return { from: null, to: end, quarter: key };
    }
    case 'year':
      return { from: null, to: end, academicYear: academicYearOf(end) };
    default:
      return { from: null, to: null };
  }
}

function inRange(date, range) {
  const d = toDate(date);
  if (!d) return false;
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  if (range.quarter && quarterOf(d) !== range.quarter) return false;
  if (range.academicYear && academicYearOf(d) !== range.academicYear) return false;
  return true;
}

/**
 * filters: { period, academicYear, grade, classId, shanyrakId, uid, language, genre, hundredOnly, status }
 * students: roster rows keyed by uid or email ({ uid, email, classId, grade, shanyrakId, academicYear })
 */
export function makeStudentMatcher(filters = {}, studentsByUid = new Map()) {
  return (uid) => {
    const s = studentsByUid.get(uid);
    if (filters.uid && filters.uid !== uid) return false;
    if (filters.classId && s?.classId !== filters.classId) return false;
    if (filters.grade && Number(s?.grade) !== Number(filters.grade)) return false;
    if (filters.shanyrakId && s?.shanyrakId !== filters.shanyrakId) return false;
    if (filters.academicYear && s && s.academicYear && s.academicYear !== filters.academicYear) return false;
    return true;
  };
}

function bookMatches(record, filters) {
  if (filters.language && record.language && record.language !== filters.language) return false;
  if (filters.language && !record.language) return false;
  if (filters.genre && !(Array.isArray(record.genre) ? record.genre : [record.genre]).includes(filters.genre)) return false;
  if (filters.hundredOnly && !record.isHundred) return false;
  return true;
}

export function filterEvents(events, filters = {}, studentsByUid = new Map(), now = new Date()) {
  const range = periodRange(filters.period, now);
  const studentOk = makeStudentMatcher(filters, studentsByUid);
  return events.filter((e) => {
    if (!inRange(e.occurredAt, range)) return false;
    if (filters.academicYear && academicYearOf(e.occurredAt) !== filters.academicYear) return false;
    if (filters.status && e.type !== filters.status) return false;
    if (!studentOk(e.uid)) return false;
    return bookMatches(e, filters);
  });
}

export function filterProgress(progress, filters = {}, studentsByUid = new Map(), now = new Date()) {
  const range = periodRange(filters.period, now);
  const studentOk = makeStudentMatcher(filters, studentsByUid);
  return progress.filter((p) => {
    const when = p.verifiedAt || p.requestedAt || p.updatedAt;
    if (filters.period && filters.period !== 'all' && !inRange(when, range)) return false;
    if (filters.academicYear && when && academicYearOf(when) !== filters.academicYear) return false;
    if (filters.status && p.verificationStatus !== filters.status && p.status !== filters.status) return false;
    if (!studentOk(p.uid)) return false;
    return bookMatches(p, filters);
  });
}

function countBy(items, keyOf) {
  const map = new Map();
  for (const item of items) {
    const keys = [].concat(keyOf(item)).filter(Boolean);
    for (const key of keys) map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function topBy(items, keyOf, limit = 10) {
  return countBy(items, keyOf).slice(0, limit);
}

export function monthlySeries(items, dateOf, months = 12, now = new Date()) {
  const keys = [];
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = months - 1; i >= 0; i -= 1) keys.push(monthOf(new Date(d.getFullYear(), d.getMonth() - i, 1)));
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const item of items) {
    const k = monthOf(dateOf(item));
    if (k in counts) counts[k] += 1;
  }
  return keys.map((k) => ({ label: k, value: counts[k] }));
}

export function activeReaders(events, days, now = new Date()) {
  const from = new Date(now - days * DAY);
  const readerTypes = new Set(['reservation', 'issue', 'return', 'verification_request', 'confirmed']);
  const set = new Set();
  for (const e of events) {
    const d = toDate(e.occurredAt);
    if (d && d >= from && d <= now && readerTypes.has(e.type)) set.add(e.uid);
  }
  return set.size;
}

/**
 * Main KPI block.
 * @param data { events, progress, reservations, students, hundredIds }
 */
export function computeKpis(data, filters = {}, now = new Date()) {
  const studentsByUid = new Map((data.students || []).filter((s) => s.uid).map((s) => [s.uid, s]));
  const events = filterEvents(data.events || [], filters, studentsByUid, now);
  const progress = filterProgress(data.progress || [], { ...filters, period: filters.period || 'all' }, studentsByUid, now);
  const reservations = (data.reservations || []).filter((r) => makeStudentMatcher(filters, studentsByUid)(r.uid));

  const confirmed = progress.filter((p) => p.verificationStatus === 'confirmed');
  const confirmedReaders = new Set(confirmed.map((p) => p.uid));
  const hundredParticipants = new Set(progress.filter((p) => p.isHundred).map((p) => p.uid));
  const hundredConfirmed = confirmed.filter((p) => p.isHundred);
  // Roster rows are matched directly: students who have not signed in yet have no uid.
  const totalStudents = (data.students || []).filter((s) => {
    if (filters.uid && s.uid !== filters.uid) return false;
    if (filters.classId && s.classId !== filters.classId) return false;
    if (filters.grade && Number(s.grade) !== Number(filters.grade)) return false;
    if (filters.shanyrakId && s.shanyrakId !== filters.shanyrakId) return false;
    if (filters.academicYear && s.academicYear && s.academicYear !== filters.academicYear) return false;
    return true;
  }).length;
  const studentBase = totalStudents || confirmedReaders.size;

  const isActive = (r) => r.status === 'active' || r.status === 'issued';
  const overdue = reservations.filter((r) => isActive(r) && toDate(r.dueDate) && toDate(r.dueDate) < now);

  // Activity windows ignore the period filter (they are windows themselves) but respect roster filters.
  const scoped = (data.events || []).filter((e) => makeStudentMatcher(filters, studentsByUid)(e.uid) && bookMatches(e, filters));
  const readerTypes = new Set(['reservation', 'issue', 'return', 'verification_request', 'confirmed']);
  const activeIn = (pred) => new Set(scoped.filter((e) => readerTypes.has(e.type) && pred(e)).map((e) => e.uid)).size;

  return {
    totalStudents,
    activeWeek: activeReaders(scoped, 7, now),
    activeMonth: activeReaders(scoped, 30, now),
    activeQuarter: activeIn((e) => quarterOf(e.occurredAt) === quarterOf(now)),
    activeYear: activeIn((e) => academicYearOf(e.occurredAt) === academicYearOf(now)),
    views: events.filter((e) => e.type === 'view').length,
    bookmarks: events.filter((e) => e.type === 'bookmark').length,
    issued: events.filter((e) => e.type === 'issue').length,
    returned: events.filter((e) => e.type === 'return').length,
    verificationRequests: events.filter((e) => e.type === 'verification_request').length,
    confirmedReads: confirmed.length,
    avgBooksPerStudent: studentBase ? Math.round((confirmed.length / studentBase) * 10) / 10 : 0,
    hundredParticipants: hundredParticipants.size,
    hundredCompletion: hundredParticipants.size
      ? Math.round((hundredConfirmed.length / (hundredParticipants.size * 100)) * 1000) / 10
      : 0,
    activeReservations: reservations.filter(isActive).length,
    overdueReservations: overdue.length,
  };
}

export function chartsData(data, filters = {}, now = new Date()) {
  const studentsByUid = new Map((data.students || []).filter((s) => s.uid).map((s) => [s.uid, s]));
  const progress = filterProgress(data.progress || [], { ...filters, period: filters.period || 'all' }, studentsByUid, now);
  const confirmed = progress.filter((p) => p.verificationStatus === 'confirmed');
  const events = filterEvents(data.events || [], filters, studentsByUid, now).filter((e) => e.type !== 'view');
  const withStudent = (p) => studentsByUid.get(p.uid) || {};

  return {
    readsByMonth: monthlySeries(confirmed, (p) => p.verifiedAt, 12, now),
    activityByMonth: monthlySeries(events, (e) => e.occurredAt, 12, now),
    topBooks: topBy(confirmed, (p) => p.bookTitle, 10),
    topAuthors: topBy(confirmed, (p) => p.bookAuthor, 10),
    genres: topBy(confirmed, (p) => p.genre, 10),
    languages: topBy(confirmed, (p) => p.language, 5),
    topClasses: topBy(confirmed, (p) => withStudent(p).className, 10),
    shanyraks: topBy(confirmed, (p) => withStudent(p).shanyrakName, 30),
    hundredByGrade: topBy(confirmed.filter((p) => p.isHundred), (p) => (withStudent(p).grade ? String(withStudent(p).grade) : ''), 6),
  };
}

// ---------- table helpers ----------
export function searchSortPage(rows, { query = '', fields = [], sortKey = '', sortDir = 'desc', page = 1, pageSize = 20 } = {}) {
  const q = String(query).trim().toLowerCase();
  let list = q ? rows.filter((r) => fields.some((f) => String(r[f] ?? '').toLowerCase().includes(q))) : [...rows];
  if (sortKey) {
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va ?? '').localeCompare(String(vb ?? ''), 'ru') * dir;
    });
  }
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: list.slice((current - 1) * pageSize, current * pageSize), total, pages, page: current };
}
