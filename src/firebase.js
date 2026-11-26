import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Public web config of the Firebase project (not a secret: access is decided by
// Firebase Auth, the Firestore rules and the server API).
const firebaseConfig = {
  apiKey: 'AIzaSyCMLcCiitpaQJR6Z29KFqX6fOpNV8XozMc',
  authDomain: 'nis-kitap-2025.firebaseapp.com',
  projectId: 'nis-kitap-2025',
  storageBucket: 'nis-kitap-2025.firebasestorage.app',
  messagingSenderId: '241754123505',
  appId: '1:241754123505:web:2a4f18d9516a88f31e4d50',
  measurementId: 'G-NRK1CYPJFF',
};

// Local testing against the Firebase emulators (never the real project):
//   VITE_USE_EMULATORS=1 npm run dev
const useEmulators = import.meta.env.VITE_USE_EMULATORS === '1';
if (useEmulators) firebaseConfig.projectId = 'demo-niskitap';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });
const db = getFirestore(app);

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export { auth, googleProvider, db };
