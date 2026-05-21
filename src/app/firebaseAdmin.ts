import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;

const initFirebaseAdmin = () => {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Missing Firebase Admin credentials in environment variables. " +
        "Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local"
    );
  }

  cachedApp = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  return cachedApp;
};

export const getAdminAuth = () => getAuth(initFirebaseAdmin());
export const getAdminDb = () => getFirestore(initFirebaseAdmin());
