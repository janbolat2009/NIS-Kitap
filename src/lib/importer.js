// CSV / JSON import for classes, shanyraks, curators and students.
// Template: shanyrak_name,class_name,curator_name,academic_year

const LOOKALIKE = {
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X',
  Д: 'D', Г: 'G', Л: 'L', Ф: 'F', И: 'I', Ж: 'J', Ң: 'N', Q: 'Q',
};

export function normalizeClassName(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  return raw.replace(/[А-ЯӘҒҚҢӨҰҮҺІ]/g, (ch) => LOOKALIKE[ch] || ch);
}

export function gradeOf(className) {
  const m = /^(\d{1,2})/.exec(normalizeClassName(className));
  return m ? Number(m[1]) : null;
}

export function isAcademicYear(value) {
  const m = /^(\d{4})-(\d{4})$/.exec(String(value || '').trim());
  return Boolean(m) && Number(m[2]) === Number(m[1]) + 1;
}

export function slugId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/\\.#$[\]]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function classId(academicYear, className) {
  return `${academicYear}__${normalizeClassName(className)}`;
}

export function shanyrakId(academicYear, name) {
  return `${academicYear}__${slugId(name)}`;
}

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

export const SHANYRAK_COLUMNS = ['shanyrak_name', 'class_name', 'curator_name', 'academic_year'];

export function parseShanyrakImport(input) {
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
    const name = String(data.shanyrak_name || '').trim();
    const cls = normalizeClassName(data.class_name);
    const curator = String(data.curator_name || '').trim();
    const year = String(data.academic_year || '').trim();
    const missing = SHANYRAK_COLUMNS.filter((c) => !String(data[c] || '').trim());
    if (missing.length) {
      errors.push({ line, message: `missing: ${missing.join(', ')}` });
      continue;
    }
    if (!isAcademicYear(year)) {
      errors.push({ line, message: `bad_academic_year: ${year}` });
      continue;
    }
    if (!gradeOf(cls)) {
      errors.push({ line, message: `bad_class_name: ${data.class_name}` });
      continue;
    }
    const sId = shanyrakId(year, name);
    const cId = classId(year, cls);
    const existingClass = classes.get(cId);
    if (existingClass && existingClass.shanyrakId !== sId) {
      errors.push({ line, message: `class_in_two_shanyraks: ${cls}` });
      continue;
    }
    if (existingClass) {
      warnings.push({ line, message: `duplicate_row: ${cls}` });
      continue;
    }
    const s = shanyraks.get(sId) || { id: sId, name, curatorName: curator, academicYear: year, classIds: [], classNames: [] };
    if (s.curatorName !== curator) warnings.push({ line, message: `different_curator: ${name}` });
    s.classIds.push(cId);
    s.classNames.push(cls);
    shanyraks.set(sId, s);
    classes.set(cId, { id: cId, name: cls, grade: gradeOf(cls), academicYear: year, shanyrakId: sId, shanyrakName: name, curatorName: s.curatorName });
  }
  return { shanyraks: [...shanyraks.values()], classes: [...classes.values()], errors, warnings };
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
      errors.push({ line, message: `bad_email` });
      continue;
    }
    if (!fullName || !cls || !isAcademicYear(year)) {
      errors.push({ line, message: 'missing_or_invalid_fields' });
      continue;
    }
    const cId = classId(year, cls);
    const klass = known.get(cId);
    if (knownClasses.length && !klass) {
      errors.push({ line, message: `unknown_class: ${cls}` });
      continue;
    }
    if (students.has(email)) {
      errors.push({ line, message: `duplicate_email` });
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
