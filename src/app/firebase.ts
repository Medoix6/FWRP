// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required Firebase config is present
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

// Use fallback config during build time, only validate in browser at runtime
const fallbackConfig = {
  apiKey: 'placeholder',
  authDomain: 'placeholder',
  projectId: 'placeholder',
  storageBucket: 'placeholder',
  messagingSenderId: 'placeholder',
  appId: 'placeholder',
};

const resolvedConfig = missingConfig.length > 0 ? fallbackConfig : firebaseConfig;

// Only validate and throw error in browser after app initialization
if (typeof window !== 'undefined' && missingConfig.length > 0) {
  // Delay validation to after hydration
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.warn(`Missing required Firebase configuration: ${missingConfig.join(', ')}. Please check your .env.local file.`);
  }
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(resolvedConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
