import { db } from "@/app/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export async function getUserProfileData(uid: string) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

export async function updateUserProfile(uid: string, data: { [key: string]: any }) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function uploadAvatar(file: File, uid: string) {
  const storage = getStorage();
  const avatarRef = storageRef(storage, `avatars/${uid}`);
  await uploadBytes(avatarRef, file);
  return await getDownloadURL(avatarRef);
}
