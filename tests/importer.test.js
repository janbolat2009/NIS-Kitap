import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseShanyrakImport, parseStudentImport, normalizeClassName, parseCsv } from '../src/lib/importer.js';

// Draft built from the curator and shanyrak-leader lists; must be confirmed by the
// school before it is imported on /admin/classes.
const csv = fs.readFileSync(path.resolve(__dirname, '../import-templates/class_map_2026-2027_DRAFT.csv'), 'utf8');

describe('class map import', () => {
  it('parses the 2026-2027 draft without errors', () => {
    const result = parseShanyrakImport(csv);
    expect(result.errors).toEqual([]);
    expect(result.shanyraks).toHaveLength(18);
    expect(result.classes).toHaveLength(70);
    const ertis = result.shanyraks.find((s) => s.name === 'Ертіс');
    expect(ertis.classNames).toEqual(['9A', '9B', '11M', '11N']);
    expect(ertis.academicYear).toBe('2026-2027');
  });

  it('normalizes Cyrillic look-alike letters and spaces in class names', () => {
    expect(normalizeClassName('11А')).toBe('11A');
    expect(normalizeClassName('12 Е')).toBe('12E');
    expect(normalizeClassName('9Д')).toBe('9D');
  });

  it('rejects a class assigned to two shanyraks and a bad school year', () => {
    const bad = [
      'shanyrak_name,class_name,curator_name,academic_year',
      'A,9A,Curator A,2026-2027',
      'B,9A,Curator B,2026-2027',
      'C,9C,Curator C,2026-2028',
      'D,,Curator D,2026-2027',
    ].join('\n');
    const result = parseShanyrakImport(bad);
    expect(result.errors.map((e) => e.message.split(':')[0])).toEqual(['class_in_two_shanyraks', 'bad_academic_year', 'missing']);
  });

  it('accepts semicolon CSV and JSON', () => {
    expect(parseCsv('a;b\n1;"x;y"')).toEqual([['a', 'b'], ['1', 'x;y']]);
    const json = JSON.stringify([{ shanyrak_name: 'Ертіс', class_name: '9a', curator_name: 'X', academic_year: '2027-2028' }]);
    expect(parseShanyrakImport(json).classes[0]).toMatchObject({ id: '2027-2028__9A', grade: 9 });
  });
});

describe('student import', () => {
  const { classes } = parseShanyrakImport(csv);

  it('links students to class and shanyrak', () => {
    const result = parseStudentImport('email,full_name,class_name,academic_year\nPupil@School.kz,Аманова Адема,11m,2026-2027', classes);
    expect(result.errors).toEqual([]);
    expect(result.students[0]).toMatchObject({ email: 'pupil@school.kz', className: '11M', shanyrakName: 'Ертіс', grade: 11 });
  });

  it('reports unknown classes, bad emails and duplicates', () => {
    const text = [
      'email,full_name,class_name,academic_year',
      'a@school.kz,A B,12Z,2026-2027',
      'not-an-email,A B,9A,2026-2027',
      'c@school.kz,C D,9A,2026-2027',
      'c@school.kz,C D,9A,2026-2027',
    ].join('\n');
    const result = parseStudentImport(text, classes);
    expect(result.errors.map((e) => e.message.split(':')[0])).toEqual(['unknown_class', 'bad_email', 'duplicate_email']);
    expect(result.students).toHaveLength(1);
  });
});
