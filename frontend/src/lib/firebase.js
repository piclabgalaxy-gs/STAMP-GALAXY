import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD3d4yMOCvtHe5R2K8BmGX2eqDQm-CoSvo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "galaxystamp2.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "galaxystamp2",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "galaxystamp2.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "898960105483",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:898960105483:web:e3f884c0f9e0601b55670e",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-F2RSYXD9CN",
};

const app = getApps()[0] || initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
