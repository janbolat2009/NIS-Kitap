import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyCMLcCiitpaQJR6Z29KFqX6fOpNV8XozMc",
  authDomain: "nis-kitap-2025.firebaseapp.com",
  projectId: "nis-kitap-2025",
  storageBucket: "nis-kitap-2025.firebasestorage.app",
  messagingSenderId: "241754123505",
  appId: "1:241754123505:web:2a4f18d9516a88f31e4d50",
  measurementId: "G-NRK1CYPJFF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const db = getFirestore(app);
const storage = getStorage(app); 

export { auth, googleProvider, db, storage }; 