import { NextResponse } from "next/server";
import { createSuccessResponse } from "@/lib/apiError";
import { generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json(createSuccessResponse({ csrfToken: token }), { status: 200 });
  setCsrfCookie(response, token);
  return response;
}
