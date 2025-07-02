export function isAuthenticated() {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("auth");
  }
  return false;
}

export function isAdmin() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("role") === "admin";
  }
  return false;
}
