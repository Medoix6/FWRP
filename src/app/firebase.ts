// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import type { FirebaseOptions } from "firebase/app";
// https://firebase.google.com/docs/web/setup#available-libraries

const isBrowser = typeof window !== "undefined";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig: Array<keyof FirebaseOptions> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key]);


const firebaseInitError = missingConfig.length > 0
  ? `Missing required Firebase configuration: ${missingConfig.join(", ")}. Set NEXT_PUBLIC_FIREBASE_* variables in your environment.`
  : null;

if (isBrowser && firebaseInitError) {
  console.warn(firebaseInitError);
}


const app = isBrowser && !missingConfig.length
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : (undefined as unknown as ReturnType<typeof getAuth>);
export const db = app ? getFirestore(app) : (undefined as unknown as ReturnType<typeof getFirestore>);

if (isBrowser && db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore persistence failed: multiple tabs open.");
    } else if (err.code === "unimplemented") {
      console.warn("Firestore persistence not supported in this browser.");
    }
  });
}

export { firebaseInitError };
