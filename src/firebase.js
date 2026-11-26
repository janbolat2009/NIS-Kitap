import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';

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
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === '1';
if (useEmulators) firebaseConfig.projectId = 'demo-niskitap';

// Only Firebase App + Auth start with the page. Firestore lives in
// src/firebaseDb.js and is loaded with the pages that read it, so the first
// screen does not download the Firestore SDK.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (useEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

export { app, auth, googleProvider };
