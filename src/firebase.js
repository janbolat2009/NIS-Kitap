import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Добавляем поддержку Storage

// Твоя конфигурация из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCMLcCiitpaQJR6Z29KFqX6fOpNV8XozMc",
  authDomain: "nis-kitap-2025.firebaseapp.com",
  projectId: "nis-kitap-2025",
  storageBucket: "nis-kitap-2025.firebasestorage.app",
  messagingSenderId: "241754123505",
  appId: "1:241754123505:web:2a4f18d9516a88f31e4d50",
  measurementId: "G-NRK1CYPJFF"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Инициализируем Storage

export { auth, db, storage }; // Экспортируем storage