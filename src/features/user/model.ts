// User model for Firestore
export interface User {
  uid: string;
  email: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  displayName?: string;
}
