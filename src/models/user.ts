// User model for Firestore
export interface User {
  uid: string;
  email: string;
  isAdmin?: boolean;
  displayName?: string;
}
