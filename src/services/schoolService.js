// Public school structure: current academic year and the class list.
// Read straight from Firestore (public, read-only); written only by the server.
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { academicYearOfDate, compareClassNames } from '@/lib/school';

let schoolCache = null;

export async function getSchoolSettings() {
  if (schoolCache) return schoolCache;
  try {
    const snap = await getDoc(doc(db, 'settings', 'school'));
    const data = snap.exists() ? snap.data() : {};
    schoolCache = { holdHours: 48, ...data, currentAcademicYear: data.currentAcademicYear || academicYearOfDate(new Date()) };
  } catch {
    schoolCache = { holdHours: 48, currentAcademicYear: academicYearOfDate(new Date()) };
  }
  return schoolCache;
}

export async function listClasses(academicYear) {
  const year = academicYear || (await getSchoolSettings()).currentAcademicYear;
  const snap = await getDocs(query(collection(db, 'class_map'), where('academicYear', '==', year)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.active !== false)
    .sort((a, b) => compareClassNames(a.className, b.className));
}

export async function listShanyrakPoints(academicYear) {
  const snap = await getDocs(query(collection(db, 'shanyrak_points'), where('academicYear', '==', academicYear)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listShanyraks(academicYear) {
  const snap = await getDocs(query(collection(db, 'shanyraks'), where('academicYear', '==', academicYear)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false);
}
