// src/utils/firebaseErrors.ts
const ERROR_MAP: Record<string, string> = {
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "permission-denied": "You don't have permission to do that.",
  "unavailable": "Service temporarily unavailable. Please try again.",
  "not-found": "The requested item no longer exists.",
};

export const getFirebaseErrorMessage = (error: any): string => {
  return ERROR_MAP[error?.code] || error?.message || "Something went wrong. Please try again.";
};
