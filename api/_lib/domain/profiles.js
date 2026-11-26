// Student profile: name for public labels, class and shanyrak.
// The shanyrak is never taken from the client: the server looks the class up in
// class_map/{year__CLASS} and copies the shanyrak from there. A class that is in
// the list but not mapped yet gives an empty shanyrak — points are then kept on
// the student and not credited to any shanyrak.
import { db } from '../admin.js';
import { fail, str, oneOf } from '../http.js';
import { audit } from '../audit.js';
import { getSchool } from '../settings.js';
import {
  classMapId, cleanPersonName, publicShortName, splitDisplayName, gradeOf, normalizeClassName, readerLabel,
} from '../../../src/lib/school.js';
import { cleanEmail } from '../../../src/lib/roles.js';

const profiles = () => db().collection('profiles');

export function publicSchool(school) {
  return {
    currentAcademicYear: school.currentAcademicYear,
    registrationOpen: school.registrationOpen,
    holdHours: school.holdHours,
    loanDays: school.loanDays,
    maxOpenReservations: school.maxOpenReservations,
    pickupPlaces: school.pickupPlaces,
    selfClassChangeDays: school.selfClassChangeDays,
  };
}

function emptyProfile(actor, now) {
  const { firstName, lastName } = splitDisplayName(actor.name || actor.email.split('@')[0]);
  return {
    uid: actor.uid,
    email: actor.email,
    emailVerified: actor.emailVerified,
    firstName,
    lastName,
    shortName: publicShortName(firstName, lastName),
    classId: '',
    className: '',
    grade: null,
    academicYear: '',
    shanyrakId: '',
    shanyrakName: '',
    classSource: '',
    classSetAt: '',
    selfClassChanges: 0,
    privacyMode: 'short',
    locale: '',
    createdAt: now,
    updatedAt: now,
  };
}

// Class from an admin import (students/{email}) for the current year, if any.
async function rosterClass(email, school) {
  try {
    const snap = await db().collection('students').doc(cleanEmail(email)).get();
    if (!snap.exists) return null;
    const r = snap.data();
    if (r.academicYear !== school.currentAcademicYear || !r.className) return null;
    const map = await db().collection('class_map').doc(classMapId(school.currentAcademicYear, r.className)).get();
    if (!map.exists || map.data().active === false) return null;
    return { map: map.data(), fullName: r.fullName || '' };
  } catch {
    return null;
  }
}

function classFields(map, school, source, now) {
  return {
    classId: map.id,
    className: map.className,
    grade: gradeOf(map.className),
    academicYear: school.currentAcademicYear,
    shanyrakId: map.shanyrakId || '',
    shanyrakName: map.shanyrakId ? map.shanyrakName || '' : '',
    classSource: source,
    classSetAt: now,
  };
}

function historyEntry(uid, email, before, after, actor, source, reason) {
  return {
    uid,
    email,
    academicYear: after.academicYear || before?.academicYear || '',
    from: before?.classId ? {
      classId: before.classId, className: before.className, shanyrakId: before.shanyrakId || '', shanyrakName: before.shanyrakName || '', academicYear: before.academicYear || '',
    } : null,
    to: { classId: after.classId, className: after.className, shanyrakId: after.shanyrakId || '', shanyrakName: after.shanyrakName || '' },
    source,
    reason: String(reason || '').slice(0, 300),
    by: actor?.uid || 'system',
    byRole: actor?.role || 'system',
    at: new Date().toISOString(),
  };
}

export function needsClass(actor, profile, school) {
  return actor.role === 'student' && (!profile?.classId || profile.academicYear !== school.currentAcademicYear);
}

export async function getMe(actor) {
  const school = await getSchool();
  const ref = profiles().doc(actor.uid);
  const now = new Date().toISOString();
  const snap = await ref.get();
  let profile = snap.exists ? snap.data() : null;
  if (!profile) {
    profile = emptyProfile(actor, now);
    if (actor.emailVerified) {
      const roster = await rosterClass(actor.email, school);
      if (roster) {
        Object.assign(profile, classFields(roster.map, school, 'import', now));
        if (roster.fullName) {
          // Roster names are «Фамилия Имя».
          const parts = roster.fullName.split(/\s+/);
          if (parts.length >= 2) {
            profile.lastName = cleanPersonName(parts[0], 40);
            profile.firstName = cleanPersonName(parts[1], 40);
            profile.shortName = publicShortName(profile.firstName, profile.lastName);
          }
        }
      }
    }
    await ref.create(profile).catch(async (err) => {
      if (String(err.code) !== '6' && !/already exists/i.test(err.message)) throw err;
      profile = (await ref.get()).data();
    });
    if (profile.classId) {
      await db().collection('class_history').add(historyEntry(actor.uid, actor.email, null, profile, null, 'import', 'roster'));
    }
  } else if (profile.emailVerified !== actor.emailVerified || profile.email !== actor.email) {
    await ref.update({ emailVerified: actor.emailVerified, email: actor.email, updatedAt: now });
    profile = { ...profile, emailVerified: actor.emailVerified, email: actor.email };
  }
  return {
    uid: actor.uid,
    email: actor.email,
    emailVerified: actor.emailVerified,
    name: actor.name,
    role: actor.role,
    permissions: actor.permissions,
    profile,
    needsClass: needsClass(actor, profile, school),
    school: publicSchool(school),
  };
}

async function loadMap(tx, academicYear, className) {
  const ref = db().collection('class_map').doc(classMapId(academicYear, className));
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists || snap.data().active === false) fail(400, 'unknown_class');
  return { id: snap.id, ...snap.data() };
}

/**
 * The student picks their class for the current academic year.
 * First choice is free; one correction is allowed within selfClassChangeDays;
 * after that only the tech admin can move the student.
 */
export async function setMyClass(actor, body) {
  const school = await getSchool();
  const className = normalizeClassName(str(body.className, { max: 6, required: true, field: 'className' }));
  const firstName = cleanPersonName(str(body.firstName, { max: 40, field: 'firstName' }), 40);
  const lastName = cleanPersonName(str(body.lastName, { max: 40, field: 'lastName' }), 40);
  if (!firstName) fail(400, 'missing_field', { field: 'firstName' });
  if (!school.registrationOpen) fail(403, 'registration_closed');
  const ref = profiles().doc(actor.uid);
  const now = new Date().toISOString();

  return db().runTransaction(async (tx) => {
    const map = await loadMap(tx, school.currentAcademicYear, className);
    const snap = await tx.get(ref);
    const before = snap.exists ? snap.data() : emptyProfile(actor, now);
    const names = { firstName, lastName, shortName: publicShortName(firstName, lastName) };
    const sameYear = before.academicYear === school.currentAcademicYear && before.classId;

    if (sameYear && before.classId === map.id) {
      tx.set(ref, { ...names, updatedAt: now }, { merge: true });
      return { ...before, ...names };
    }
    let selfClassChanges = Number(before.selfClassChanges) || 0;
    if (sameYear) {
      const setAt = new Date(before.classSetAt || 0).getTime();
      const windowOk = Date.now() - setAt <= school.selfClassChangeDays * 24 * 3600 * 1000;
      if (before.classSource !== 'self' || selfClassChanges >= 1 || !windowOk) fail(403, 'class_locked');
      selfClassChanges += 1;
    } else {
      selfClassChanges = 0;
    }
    const after = {
      ...before,
      ...names,
      ...classFields(map, school, 'self', now),
      selfClassChanges,
      email: actor.email,
      emailVerified: actor.emailVerified,
      updatedAt: now,
    };
    tx.set(ref, after);
    tx.set(db().collection('class_history').doc(), historyEntry(actor.uid, actor.email, sameYear ? before : null, after, actor, 'self', ''));
    const lb = db().collection('leaderboard').doc(actor.uid);
    tx.set(lb, { uid: actor.uid, className: after.className, shanyrakName: after.shanyrakName, nameShort: after.privacyMode === 'hidden' ? '' : after.shortName, privacyMode: after.privacyMode, updatedAt: now }, { merge: true });
    return after;
  });
}

// Tech admin moves a student to another class (with a reason). Past points keep
// the class and shanyrak they were earned in.
export async function changeStudentClass(actor, uid, body) {
  const school = await getSchool();
  const academicYear = body.academicYear || school.currentAcademicYear;
  const className = normalizeClassName(str(body.className, { max: 6, required: true, field: 'className' }));
  const reason = str(body.reason, { min: 3, max: 300, required: true, field: 'reason' });
  const ref = profiles().doc(uid);
  const now = new Date().toISOString();
  return db().runTransaction(async (tx) => {
    const map = await loadMap(tx, academicYear, className);
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'student_not_found');
    const before = snap.data();
    const after = {
      ...before,
      ...classFields(map, { ...school, currentAcademicYear: academicYear }, 'admin', now),
      updatedAt: now,
    };
    tx.set(ref, after);
    tx.set(db().collection('class_history').doc(), historyEntry(uid, before.email, before, after, actor, 'admin', reason));
    tx.set(db().collection('leaderboard').doc(uid), { className: after.className, shanyrakName: after.shanyrakName, updatedAt: now }, { merge: true });
    audit(tx, actor, 'student_class_changed', 'profiles', uid,
      { classId: before.classId, shanyrakId: before.shanyrakId }, { classId: after.classId, shanyrakId: after.shanyrakId }, reason);
    return after;
  });
}

export async function setPrivacy(actor, body) {
  const mode = oneOf(body.mode, ['short', 'hidden'], 'mode');
  const ref = profiles().doc(actor.uid);
  const snap = await ref.get();
  if (!snap.exists) fail(404, 'profile_not_found');
  const p = snap.data();
  const now = new Date().toISOString();
  const batch = db().batch();
  batch.update(ref, { privacyMode: mode, updatedAt: now });
  batch.set(db().collection('leaderboard').doc(actor.uid), { privacyMode: mode, nameShort: mode === 'hidden' ? '' : p.shortName || '', updatedAt: now }, { merge: true });
  const reviews = await db().collection('reviews').where('uid', '==', actor.uid).get();
  const label = readerLabel({ shortName: p.shortName, className: p.className, privacyMode: mode });
  reviews.forEach((d) => batch.update(d.ref, { authorLabel: label }));
  await batch.commit();
  return { privacyMode: mode };
}

export async function setLocale(actor, body) {
  const locale = oneOf(body.locale, ['ru', 'kz', 'en'], 'locale');
  await profiles().doc(actor.uid).set({ locale, updatedAt: new Date().toISOString() }, { merge: true });
  return { locale };
}
