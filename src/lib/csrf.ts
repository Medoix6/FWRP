import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ForbiddenError } from "@/lib/apiError";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_MAX_AGE = 60 * 60; // 1 hour

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: "/",
  });
}

export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

export function validateCsrfToken(request: NextRequest): void {
  const cookieToken = getCsrfTokenFromRequest(request);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenError("Invalid CSRF token");
  }
}

export const csrfHeaderName = CSRF_HEADER_NAME;
