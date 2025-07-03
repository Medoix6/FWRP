import { db } from "@/app/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function fetchAllUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
