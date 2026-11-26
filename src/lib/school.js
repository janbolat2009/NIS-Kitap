// School structure helpers shared by the server, the UI and the tests:
// academic years, class names, class ↔ shanyrak map ids and safe public names.
// Nothing here contains real school data: the class list and the shanyrak map
// are managed by the tech admin and stored in Firestore (class_map, shanyraks).

// NIS class letters are Latin. Cyrillic look-alikes typed by people are mapped
// to the Latin letter they look like («10Н» → 10H, «12Р» → 12P), plus a few
// phonetic ones that have no look-alike («9Д» → 9D, «8Г» → 8G).
const CYRILLIC_TO_LATIN = {
  А: 'A', В: 'B', С: 'C', Д: 'D', Е: 'E', Ф: 'F', Г: 'G', Н: 'H', И: 'I', І: 'I',
  К: 'K', Л: 'L', М: 'M', Ң: 'N', О: 'O', Р: 'P', Т: 'T', Х: 'X', Э: 'E', Ү: 'Y', У: 'Y',
};

export function normalizeClassName(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/[\s\-_.]+/g, '');
  return raw.replace(/[А-ЯӘҒҚҢӨҰҮҺІЁ]/g, (ch) => CYRILLIC_TO_LATIN[ch] || ch);
}

export function isValidClassName(value) {
  return /^(?:[1-9]|1[0-2])[A-Z]{1,2}$/.test(normalizeClassName(value));
}

export function gradeOf(className) {
  const m = /^(\d{1,2})/.exec(normalizeClassName(className));
  return m ? Number(m[1]) : null;
}

export function letterOf(className) {
  const m = /^\d{1,2}([A-Z]{1,2})$/.exec(normalizeClassName(className));
  return m ? m[1] : '';
}

export function compareClassNames(a, b) {
  const ga = gradeOf(a) || 0;
  const gb = gradeOf(b) || 0;
  if (ga !== gb) return ga - gb;
  return letterOf(a).localeCompare(letterOf(b));
}

// ---------- academic years ----------
// The school year runs 1 September → 31 August.
export function isAcademicYear(value) {
  const m = /^(\d{4})-(\d{4})$/.exec(String(value || '').trim());
  return Boolean(m) && Number(m[2]) === Number(m[1]) + 1;
}

export function academicYearOfDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getUTCFullYear();
  return d.getUTCMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function nextAcademicYear(year) {
  if (!isAcademicYear(year)) return '';
  const start = Number(year.slice(0, 4)) + 1;
  return `${start}-${start + 1}`;
}

// ---------- ids ----------
export function slugId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/\\.#$[\]]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function classMapId(academicYear, className) {
  return `${academicYear}__${normalizeClassName(className)}`;
}

export function shanyrakDocId(academicYear, name) {
  return `${academicYear}__${slugId(name)}`;
}

// ---------- names ----------
export function cleanPersonName(value, max = 60) {
  return String(value || '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>{}[\]\\/@#$%^*=+|~`"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Public label for minors: first name + initial of the last name, never the full
// surname or the e-mail. «Адема», «Аманова» → «Адема А.».
export function publicShortName(firstName, lastName) {
  const first = cleanPersonName(firstName, 40).split(' ')[0] || '';
  const last = cleanPersonName(lastName, 40);
  if (!first) return '';
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

// Splits a display name into first/last for the onboarding form defaults.
export function splitDisplayName(displayName) {
  const parts = cleanPersonName(displayName, 80).split(' ').filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Label shown next to a review or in the leaderboard.
export function readerLabel({ shortName, className, privacyMode } = {}, hidden = 'Читатель') {
  if (privacyMode === 'hidden' || !shortName) {
    const grade = gradeOf(className);
    return grade ? `${hidden}, ${grade} класс` : hidden;
  }
  return className ? `${shortName}, ${className}` : shortName;
}
