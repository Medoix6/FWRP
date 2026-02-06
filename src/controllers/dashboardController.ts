import { db } from "@/app/firebase";
import { AuthTokenManager } from "@/lib/clientAuth";
// import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import type { User } from "firebase/auth";

export async function getUserProfile(firebaseUser: User) {
  const displayName = firebaseUser.displayName
    ? firebaseUser.displayName
    : firebaseUser.email
      ? firebaseUser.email.split("@")[0]
      : "No Username";
  const email = firebaseUser.email || "No Email";
  let fullName = null;
  let avatar = "";
  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    fullName = data.name || null;
    avatar = data.avatar || "";
  }
  return {
    displayName,
    email,
    fullName,
    avatar,
  };
}

export async function fetchDonatedFood() {
  const authHeader = AuthTokenManager.getAuthHeader();
  const res = await fetch("/api/donated-food", {
    headers: {
      ...(authHeader || {}),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch donated food");
  const response = await res.json();
  return response.data || response;
}
