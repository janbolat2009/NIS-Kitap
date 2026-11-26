// Firestore client. Kept apart from src/firebase.js so the Firestore SDK is
// bundled with the pages and services that read it, not with the first screen.
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { app, useEmulators } from '@/firebase';

const db = getFirestore(app);
if (useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080);

export { db };
