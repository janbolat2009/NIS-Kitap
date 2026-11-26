// Test data for the local emulators (demo project). Never run against production:
// it refuses to start without FIRESTORE_EMULATOR_HOST.
// Class and shanyrak names here are invented for testing, not school data.
import { adminAuth, db } from '../api/_lib/admin.js';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('emulator only');

const YEAR = '2026-2027';
const users = [
  { email: 'muldasheva_v@ast.nis.edu.kz', name: 'Библиотекарь Тест' },
  { email: 'bekbolatov_zh@ast.nis.edu.kz', name: 'Директор Тест' },
  { email: 'janbolatique.kz@gmail.com', name: 'Техадмин Тест' },
  { email: 'pupil1@test.local', name: 'Адема Тестова' },
  { email: 'pupil2@test.local', name: 'Бекзат Тестов' },
];

for (const u of users) {
  try {
    await adminAuth().createUser({ email: u.email, password: 'test-password-1', emailVerified: true, displayName: u.name });
  } catch {
    // exists
  }
}

await db().collection('settings').doc('school').set({ currentAcademicYear: YEAR, holdHours: 48, maxOpenReservations: 3, pickupPlaces: ['Библиотека, 1 этаж', 'Читальный зал'] });
const map = [['10A', 'Тест-Алатау'], ['10B', 'Тест-Алатау'], ['11A', 'Тест-Каспий'], ['11B', 'Тест-Каспий'], ['9C', '']];
for (const [cls, sh] of map) {
  const shId = sh ? `${YEAR}__${sh.toLowerCase()}` : '';
  await db().collection('class_map').doc(`${YEAR}__${cls}`).set({ id: `${YEAR}__${cls}`, className: cls, grade: Number(cls.match(/\d+/)[0]), academicYear: YEAR, shanyrakId: shId, shanyrakName: sh, active: true });
  if (sh) await db().collection('shanyraks').doc(shId).set({ id: shId, name: sh, academicYear: YEAR, active: true, classNames: map.filter((m) => m[1] === sh).map((m) => m[0]) });
}
console.log('seeded: users (password test-password-1), class map, settings');
