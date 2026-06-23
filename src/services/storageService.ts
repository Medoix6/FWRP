import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB = 2; // Capped at 2MB for avatars as per rules

export const storageService = {
  async uploadAvatar(file: File, uid: string) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed.");
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`Image size must be under ${MAX_SIZE_MB}MB.`);
    }

    const storage = getStorage();
    const avatarRef = storageRef(storage, `avatars/${uid}`);
    await uploadBytes(avatarRef, file);
    return await getDownloadURL(avatarRef);
  },

  async deleteAvatar(uid: string) {
    try {
      const storage = getStorage();
      const avatarRef = storageRef(storage, `avatars/${uid}`);
      await deleteObject(avatarRef);
    } catch (error: any) {
      console.warn("Storage avatar delete warning:", error.message);
    }
  }
};
