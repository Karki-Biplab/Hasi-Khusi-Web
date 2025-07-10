// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCkZ2d4tuh7OtPcHUmkPqNbEv_52Kblh90",
  authDomain: "workshop-management-sys.firebaseapp.com",
  projectId: "workshop-management-sys",
  storageBucket: "workshop-management-sys.firebasestorage.app",
  messagingSenderId: "643643416124",
  appId: "1:643643416124:web:6b7e62f544402456a0ad39",
  measurementId: "G-TW616QJGRY"
};


// Validate configuration
if (!firebaseConfig.apiKey) {
  console.error('Firebase API key is missing. Please check your .env.local file.');
}

if (!firebaseConfig.projectId) {
  console.error('Firebase project ID is missing. Please check your .env.local file.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;