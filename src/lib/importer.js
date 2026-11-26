// CSV / JSON import for the class ↔ shanyrak map and the student roster.
// Class map template:   academic_year,class_name,shanyrak_name[,curator_name]
//   An empty shanyrak_name means «класс есть, шаңырак пока не сопоставлен».
// Student template:     email,full_name,class_name,academic_year
import {
  normalizeClassName, isValidClassName, gradeOf, isAcademicYear, classMapId, shanyrakDocId, slugId,
} from './school.js';

export { normalizeClassName, gradeOf, isAcademicYear, slugId };
export const classId = classMapId;
export const shanyrakId = shanyrakDocId;

// Minimal RFC-4180 parser; accepts "," or ";" (Excel with a Russian locale).
export function parseCsv(text) {
  const src = String(text || '').replace(new RegExp('^' + String.fromCharCode(0xfeff)), '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

function toRecords(input) {
  if (Array.isArray(input)) return input.map((r, i) => ({ line: i + 1, data: r }));
  const text = String(input || '').trim();
  if (text.startsWith('[')) {
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) throw new Error('JSON must be an array');
    return arr.map((r, i) => ({ line: i + 1, data: r }));
  }
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells, i) => {
    const data = {};
    header.forEach((h, idx) => {
      data[h] = (cells[idx] ?? '').trim();
    });
    return { line: i + 2, data };
  });
}

export const CLASS_MAP_COLUMNS = ['academic_year', 'class_name', 'shanyrak_name'];
export const SHANYRAK_COLUMNS = CLASS_MAP_COLUMNS;

/**
 * Parses a class map. `defaultYear` is used when the academic_year column is empty.
 * @returns {{ classes: Array, shanyraks: Array, errors: Array, warnings: Array }}
 */
export function parseClassMapImport(input, { defaultYear = '' } = {}) {
  const errors = [];
  const warnings = [];
  const shanyraks = new Map();
  const classes = new Map();
  let records = [];
  try {
    records = toRecords(input);
  } catch (err) {
    return { shanyraks: [], classes: [], errors: [{ line: 0, message: `invalid_format: ${err.message}` }], warnings };
  }
  for (const { line, data } of records) {
    const year = String(data.academic_year || data.academicYear || defaultYear || '').trim();
    const rawClass = String(data.class_name ?? data.className ?? '').trim();
    const name = String(data.shanyrak_name ?? data.shanyrakName ?? '').trim().replace(/\s+/g, ' ');
    const curator = String(data.curator_name ?? data.curatorName ?? '').trim();
    if (!rawClass) {
      errors.push({ line, message: 'missing: class_name' });
      continue;
    }
    if (!isAcademicYear(year)) {
      errors.push({ line, message: `bad_academic_year: ${year}` });
      continue;
    }
    const cls = normalizeClassName(rawClass);
    if (!isValidClassName(cls)) {
      errors.push({ line, message: `bad_class_name: ${rawClass}` });
      continue;
    }
    if (name.length > 60) {
      errors.push({ line, message: 'shanyrak_name_too_long' });
      continue;
    }
    const cId = classMapId(year, cls);
    const sId = name ? shanyrakDocId(year, name) : '';
    const existing = classes.get(cId);
    if (existing && existing.shanyrakId !== sId) {
      errors.push({ line, message: `class_in_two_shanyraks: ${cls}` });
      continue;
    }
    if (existing) {
      warnings.push({ line, message: `duplicate_row: ${cls}` });
      continue;
    }
    if (rawClass !== cls) warnings.push({ line, message: `normalized: ${rawClass} → ${cls}` });
    if (!name) warnings.push({ line, message: `unmapped: ${cls}` });
    if (sId) {
      const s = shanyraks.get(sId) || { id: sId, name, academicYear: year, curatorName: curator, classNames: [] };
      s.classNames.push(cls);
      shanyraks.set(sId, s);
    }
    classes.set(cId, {
      id: cId, className: cls, grade: gradeOf(cls), academicYear: year, shanyrakId: sId, shanyrakName: name, active: true,
    });
  }
  return { shanyraks: [...shanyraks.values()], classes: [...classes.values()], errors, warnings };
}

// Old name kept for the previous admin page and tests.
export function parseShanyrakImport(input, options) {
  return parseClassMapImport(input, options);
}

export const STUDENT_COLUMNS = ['email', 'full_name', 'class_name', 'academic_year'];

export function parseStudentImport(input, knownClasses = []) {
  const errors = [];
  const students = new Map();
  const known = new Map(knownClasses.map((c) => [c.id, c]));
  let records = [];
  try {
    records = toRecords(input);
  } catch (err) {
    return { students: [], errors: [{ line: 0, message: `invalid_format: ${err.message}` }] };
  }
  for (const { line, data } of records) {
    const email = String(data.email || '').trim().toLowerCase();
    const fullName = String(data.full_name || '').trim().replace(/\s+/g, ' ');
    const cls = normalizeClassName(data.class_name);
    const year = String(data.academic_year || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line, message: 'bad_email' });
      continue;
    }
    if (!fullName || !isValidClassName(cls) || !isAcademicYear(year)) {
      errors.push({ line, message: 'missing_or_invalid_fields' });
      continue;
    }
    const cId = classMapId(year, cls);
    const klass = known.get(cId);
    if (knownClasses.length && !klass) {
      errors.push({ line, message: `unknown_class: ${cls}` });
      continue;
    }
    if (students.has(email)) {
      errors.push({ line, message: 'duplicate_email' });
      continue;
    }
    students.set(email, {
      email,
      fullName,
      className: cls,
      grade: gradeOf(cls),
      classId: cId,
      academicYear: year,
      shanyrakId: klass?.shanyrakId || '',
      shanyrakName: klass?.shanyrakName || '',
    });
  }
  return { students: [...students.values()], errors };
}
