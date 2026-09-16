/**
 * @deprecated Use `userProfile.isAdmin` from AuthContext instead.
 * These client-side checks rely on localStorage which can be tampered with.
 * All actual authorization is enforced server-side via Firebase Admin SDK.
 */

export function isAuthenticated() {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("auth");
  }
  return false;
}

export function isAdmin() {
  console.warn("isAdmin() from lib/auth.ts is deprecated. Use userProfile.isAdmin from AuthContext.");
  if (typeof window !== "undefined") {
    return localStorage.getItem("role") === "admin";
  }
  return false;
}
