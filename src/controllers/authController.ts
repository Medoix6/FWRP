import { signInWithEmailAndPassword, sendPasswordResetEmail, Auth } from "firebase/auth";
import { doc, getDoc, Firestore } from "firebase/firestore";
import { User } from "@/features/user/model";

// Handles user login and returns user data if successful
export async function loginUser(auth: Auth, db: Firestore, email: string, password: string): Promise<User | null> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    return { uid: user.uid, ...userDoc.data() } as User;
  }
  return null;
}

export async function sendReset(auth: Auth, email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
