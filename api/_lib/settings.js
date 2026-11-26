// School and point-rule settings (settings/school, settings/points).
// Defaults apply until a tech admin saves values on /admin/settings.
import { db } from './admin.js';
import { normalizeRules } from '../../src/lib/points.js';
import { academicYearOfDate, isAcademicYear } from '../../src/lib/school.js';

export const DEFAULT_SCHOOL = Object.freeze({
  currentAcademicYear: '',
  registrationOpen: true,
  holdHours: 48,
  pickupGraceHours: 24,
  loanDays: 14,
  maxOpenReservations: 3,
  pickupPlaces: ['Библиотека'],
  selfClassChangeDays: 7,
  utcOffset: '+05:00',
  libraryName: 'Библиотека NIS',
});

export function normalizeSchool(raw = {}, now = new Date()) {
  const r = { ...DEFAULT_SCHOOL, ...(raw || {}) };
  const clamp = (v, d, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : d;
  };
  const places = (Array.isArray(r.pickupPlaces) ? r.pickupPlaces : [])
    .map((p) => String(p || '').trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 10);
  return {
    currentAcademicYear: isAcademicYear(r.currentAcademicYear) ? r.currentAcademicYear : academicYearOfDate(now),
    registrationOpen: r.registrationOpen !== false,
    holdHours: clamp(r.holdHours, DEFAULT_SCHOOL.holdHours, 1, 24 * 14),
    pickupGraceHours: clamp(r.pickupGraceHours, DEFAULT_SCHOOL.pickupGraceHours, 0, 24 * 7),
    loanDays: clamp(r.loanDays, DEFAULT_SCHOOL.loanDays, 1, 120),
    maxOpenReservations: clamp(r.maxOpenReservations, DEFAULT_SCHOOL.maxOpenReservations, 1, 20),
    pickupPlaces: places.length ? places : [...DEFAULT_SCHOOL.pickupPlaces],
    selfClassChangeDays: clamp(r.selfClassChangeDays, DEFAULT_SCHOOL.selfClassChangeDays, 0, 60),
    utcOffset: /^[+-]\d{2}:\d{2}$/.test(String(r.utcOffset)) ? r.utcOffset : DEFAULT_SCHOOL.utcOffset,
    libraryName: String(r.libraryName || DEFAULT_SCHOOL.libraryName).slice(0, 80),
  };
}

export async function getSchool(tx) {
  const ref = db().collection('settings').doc('school');
  const snap = tx ? await tx.get(ref) : await ref.get();
  return normalizeSchool(snap.exists ? snap.data() : {});
}

export async function getRules(tx) {
  const ref = db().collection('settings').doc('points');
  const snap = tx ? await tx.get(ref) : await ref.get();
  return normalizeRules(snap.exists ? snap.data() : {});
}

// 'YYYY-MM-DD' + 'HH:MM' in school local time → Date (UTC).
export function localDateTime(date, time, utcOffset = DEFAULT_SCHOOL.utcOffset) {
  const d = new Date(`${date}T${time}:00${utcOffset}`);
  return Number.isNaN(d.getTime()) ? null : d;
}
