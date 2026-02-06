const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCookieValue(CSRF_COOKIE_NAME);
  if (existing) return existing;

  try {
    const res = await fetch("/api/csrf", { method: "GET" });
    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.data?.csrfToken || getCookieValue(CSRF_COOKIE_NAME);
  } catch {
    return null;
  }
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await ensureCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
