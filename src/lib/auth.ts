// Simple mock auth utility. Replace with real logic as needed.
export function isAuthenticated() {
  // For demo: check localStorage (client-side only)
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("auth");
  }
  return false;
}

export function isAdmin() {
  // For demo: check localStorage (client-side only)
  if (typeof window !== "undefined") {
    return localStorage.getItem("role") === "admin";
  }
  return false;
}
