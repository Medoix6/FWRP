// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyB6LYkEpOGtaAsEr3biosqd_QC3YSud9cw",
  authDomain: "fwrp-11fc3.firebaseapp.com",
  projectId: "fwrp-11fc3",
  storageBucket: "fwrp-11fc3.firebasestorage.app",
  messagingSenderId: "707085459051",
  appId: "1:707085459051:web:94dfad19e1e5b22b479b2e",
  measurementId: "G-K083R1WZWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
