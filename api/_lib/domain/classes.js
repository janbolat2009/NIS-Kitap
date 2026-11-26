// Class ↔ shanyrak map managed by the tech admin.
//   class_map/{year__CLASS}  { className, grade, academicYear, shanyrakId, shanyrakName, active }
//   shanyraks/{year__slug}   { name, academicYear, active, classNames[] }
// Public read (registration needs the class list). Written only here.
// Changing the shanyrak of a class updates the current profiles of the students in
// that class (future points go to the new shanyrak) and writes class_history;
// points already earned keep the shanyrak they were earned for.
import { db } from '../admin.js';
import { fail, str, bool } from '../http.js';
import { audit } from '../audit.js';
import { getSchool } from '../settings.js';
import { parseClassMapImport } from '../../../src/lib/importer.js';
import {
  isAcademicYear, normalizeClassName, isValidClassName, classMapId, shanyrakDocId, gradeOf, compareClassNames, nextAcademicYear,
} from '../../../src/lib/school.js';

const BATCH = 400;

async function commitOps(ops) {
  for (let i = 0; i < ops.length; i += BATCH) {
    const batch = db().batch();
    ops.slice(i, i + BATCH).forEach((op) => op(batch));
    await batch.commit();
  }
}

async function loadYear(academicYear) {
  const [classes, shanyraks] = await Promise.all([
    db().collection('class_map').where('academicYear', '==', academicYear).get(),
    db().collection('shanyraks').where('academicYear', '==', academicYear).get(),
  ]);
  return {
    classes: classes.docs.map((d) => ({ id: d.id, ...d.data() })),
    shanyraks: shanyraks.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

export async function getClassMap(query = {}) {
  const school = await getSchool();
  const academicYear = isAcademicYear(query.year) ? query.year : school.currentAcademicYear;
  const { classes, shanyraks } = await loadYear(academicYear);
  const counts = {};
  const profiles = await db().collection('profiles').where('academicYear', '==', academicYear).select('classId').get();
  profiles.forEach((d) => {
    const c = d.get('classId');
    if (c) counts[c] = (counts[c] || 0) + 1;
  });
  classes.sort((a, b) => compareClassNames(a.className, b.className));
  shanyraks.sort((a, b) => String(a.name).localeCompare(String(b.name), 'kk'));
  return {
    academicYear,
    currentAcademicYear: school.currentAcademicYear,
    classes: classes.map((c) => ({ ...c, students: counts[c.id] || 0 })),
    shanyraks,
    unmapped: classes.filter((c) => c.active !== false && !c.shanyrakId).map((c) => c.className),
  };
}

// Rebuilds shanyraks/{id}.classNames from the class map of the year.
function shanyrakOps(academicYear, classes, existingShanyraks, extraNames = new Map()) {
  const byId = new Map();
  for (const s of existingShanyraks) byId.set(s.id, { ...s, classNames: [] });
  for (const [id, name] of extraNames) if (!byId.has(id)) byId.set(id, { id, name, academicYear, active: true, classNames: [] });
  for (const c of classes) {
    if (c.active === false || !c.shanyrakId) continue;
    const s = byId.get(c.shanyrakId) || { id: c.shanyrakId, name: c.shanyrakName, academicYear, active: true, classNames: [] };
    s.classNames.push(c.className);
    s.name = s.name || c.shanyrakName;
    byId.set(c.shanyrakId, s);
  }
  const now = new Date().toISOString();
  return [...byId.values()].map((s) => (b) => b.set(db().collection('shanyraks').doc(s.id), {
    id: s.id,
    name: s.name,
    academicYear,
    active: s.classNames.length > 0 ? true : s.active !== false && extraNames.has(s.id),
    classNames: s.classNames.sort(compareClassNames),
    updatedAt: now,
  }));
}

// Updates current profiles of students of classes whose shanyrak changed.
async function profileOpsForMappingChange(actor, academicYear, changed) {
  const ops = [];
  const now = new Date().toISOString();
  for (const c of changed) {
    const snap = await db().collection('profiles').where('classId', '==', c.id).get();
    snap.forEach((d) => {
      const p = d.data();
      if (p.academicYear !== academicYear) return;
      ops.push((b) => b.update(d.ref, { shanyrakId: c.shanyrakId, shanyrakName: c.shanyrakName, updatedAt: now }));
      ops.push((b) => b.set(db().collection('leaderboard').doc(d.id), { shanyrakName: c.shanyrakName, updatedAt: now }, { merge: true }));
      ops.push((b) => b.set(db().collection('class_history').doc(), {
        uid: d.id,
        email: p.email || '',
        academicYear,
        from: { classId: p.classId, className: p.className, shanyrakId: p.shanyrakId || '', shanyrakName: p.shanyrakName || '' },
        to: { classId: c.id, className: c.className, shanyrakId: c.shanyrakId, shanyrakName: c.shanyrakName },
        source: 'mapping_change',
        reason: 'Изменено соответствие класса и шаңырака',
        by: actor.uid,
        byRole: actor.role,
        at: now,
      }));
    });
  }
  return ops;
}

/**
 * Imports a class map. dryRun returns the preview without writing anything.
 * mode 'merge' keeps classes that are not in the file, 'replace' deactivates them.
 */
export async function importClassMap(actor, body) {
  const school = await getSchool();
  const defaultYear = isAcademicYear(body.academicYear) ? body.academicYear : school.currentAcademicYear;
  const input = Array.isArray(body.rows) ? body.rows : str(body.csv, { max: 150000, required: true, field: 'csv' });
  const parsed = parseClassMapImport(input, { defaultYear });
  const years = [...new Set(parsed.classes.map((c) => c.academicYear))];
  if (years.length > 1) parsed.errors.push({ line: 0, message: `several_years: ${years.join(', ')}` });
  const academicYear = years[0] || defaultYear;
  const mode = body.mode === 'replace' ? 'replace' : 'merge';

  const existing = await loadYear(academicYear);
  const existingById = new Map(existing.classes.map((c) => [c.id, c]));
  const incomingIds = new Set(parsed.classes.map((c) => c.id));
  const added = [];
  const changed = [];
  const unchanged = [];
  for (const c of parsed.classes) {
    const prev = existingById.get(c.id);
    if (!prev) added.push(c);
    else if ((prev.shanyrakId || '') !== c.shanyrakId || prev.active === false) changed.push({ ...c, previousShanyrak: prev.shanyrakName || '' });
    else unchanged.push(c);
  }
  const deactivated = mode === 'replace' ? existing.classes.filter((c) => !incomingIds.has(c.id) && c.active !== false) : [];
  const preview = {
    academicYear,
    mode,
    errors: parsed.errors,
    warnings: parsed.warnings,
    shanyraks: parsed.shanyraks.map((s) => ({ name: s.name, classNames: s.classNames })),
    added: added.map((c) => ({ className: c.className, shanyrakName: c.shanyrakName })),
    changed: changed.map((c) => ({ className: c.className, from: c.previousShanyrak, to: c.shanyrakName })),
    unchanged: unchanged.length,
    deactivated: deactivated.map((c) => c.className),
  };
  if (bool(body.dryRun) || parsed.errors.length) return { ...preview, applied: false };

  const now = new Date().toISOString();
  const ops = [];
  const finalClasses = new Map(existing.classes.map((c) => [c.id, c]));
  for (const c of parsed.classes) {
    const data = { ...c, updatedAt: now, updatedBy: actor.uid };
    finalClasses.set(c.id, data);
    ops.push((b) => b.set(db().collection('class_map').doc(c.id), data));
  }
  for (const c of deactivated) {
    finalClasses.set(c.id, { ...c, active: false });
    ops.push((b) => b.set(db().collection('class_map').doc(c.id), { active: false, updatedAt: now, updatedBy: actor.uid }, { merge: true }));
  }
  ops.push(...shanyrakOps(academicYear, [...finalClasses.values()], existing.shanyraks));
  if (academicYear === school.currentAcademicYear) {
    ops.push(...await profileOpsForMappingChange(actor, academicYear, changed));
  }
  ops.push((b) => audit(b, actor, 'class_map_import', 'class_map', academicYear, null, {
    mode, added: added.length, changed: changed.length, unchanged: unchanged.length, deactivated: deactivated.length,
  }));
  await commitOps(ops);
  return { ...preview, applied: true };
}

export async function upsertClass(actor, body) {
  const school = await getSchool();
  const academicYear = isAcademicYear(body.academicYear) ? body.academicYear : school.currentAcademicYear;
  const className = normalizeClassName(str(body.className, { max: 6, required: true, field: 'className' }));
  if (!isValidClassName(className)) fail(400, 'bad_class_name');
  const shanyrakName = str(body.shanyrakName, { max: 60, field: 'shanyrakName' }).replace(/\s+/g, ' ');
  const active = body.active !== false;
  const id = classMapId(academicYear, className);
  const shanyrakId = shanyrakName ? shanyrakDocId(academicYear, shanyrakName) : '';
  const now = new Date().toISOString();
  const existing = await loadYear(academicYear);
  const prev = existing.classes.find((c) => c.id === id) || null;
  const data = { id, className, grade: gradeOf(className), academicYear, shanyrakId, shanyrakName, active, updatedAt: now, updatedBy: actor.uid };
  const classes = existing.classes.filter((c) => c.id !== id).concat([data]);
  const ops = [(b) => b.set(db().collection('class_map').doc(id), data)];
  ops.push(...shanyrakOps(academicYear, classes, existing.shanyraks, shanyrakId ? new Map([[shanyrakId, shanyrakName]]) : new Map()));
  if (prev && (prev.shanyrakId || '') !== shanyrakId && academicYear === school.currentAcademicYear) {
    ops.push(...await profileOpsForMappingChange(actor, academicYear, [data]));
  }
  ops.push((b) => audit(b, actor, prev ? 'class_map_update' : 'class_map_create', 'class_map', id,
    prev ? { shanyrakName: prev.shanyrakName || '', active: prev.active !== false } : null, { shanyrakName, active }));
  await commitOps(ops);
  return data;
}

/**
 * Copies the map to a new academic year. With shiftGrades every class moves one
 * grade up (10A → 11A) and the last grade is dropped; otherwise names are kept.
 */
export async function copyYear(actor, body) {
  const from = str(body.from, { max: 9, required: true, field: 'from' });
  const to = str(body.to, { max: 9, required: true, field: 'to' }) || nextAcademicYear(from);
  if (!isAcademicYear(from) || !isAcademicYear(to) || from === to) fail(400, 'bad_academic_year');
  const shift = bool(body.shiftGrades);
  const maxGrade = Number(body.maxGrade) || 12;
  const source = await loadYear(from);
  const target = await loadYear(to);
  if (target.classes.length && !bool(body.overwrite)) fail(409, 'target_year_not_empty');
  const rows = [];
  for (const c of source.classes) {
    if (c.active === false) continue;
    const grade = gradeOf(c.className);
    const newGrade = shift ? grade + 1 : grade;
    if (newGrade > maxGrade) continue;
    rows.push({ academic_year: to, class_name: `${newGrade}${c.className.replace(/^\d+/, '')}`, shanyrak_name: c.shanyrakName || '' });
  }
  return importClassMap(actor, { academicYear: to, rows, mode: 'replace', dryRun: body.dryRun });
}
