import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import type { FieldValue } from "firebase/firestore";
import { AuthTokenManager } from "@/lib/clientAuth";
import { getCsrfHeaders } from "@/lib/clientCsrf";

export async function getUserProfileData(uid: string) {
  const authHeader = AuthTokenManager.getAuthHeader();
  const res = await fetch(`/api/users/${uid}`, {
    headers: {
      ...(authHeader || {}),
    },
  });
  if (!res.ok) {
    return null;
  }
  const response = await res.json();
  return response.data || response;
}

export async function updateUserProfile(
  uid: string,
  data: { [key: string]: FieldValue | Partial<unknown> | undefined }
) {
  const authHeader = AuthTokenManager.getAuthHeader();
  const csrfHeaders = await getCsrfHeaders();
  const res = await fetch("/api/users", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader || {}),
      ...csrfHeaders,
    },
    body: JSON.stringify({ id: uid, ...data }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error?.message || errorData?.error || "Failed to update profile");
  }
}

export async function uploadAvatar(file: File, uid: string) {
  const storage = getStorage();
  const avatarRef = storageRef(storage, `avatars/${uid}`);
  await uploadBytes(avatarRef, file);
  return await getDownloadURL(avatarRef);
}
