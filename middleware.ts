import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes: /dashboard, /admin, /edit-donation, /edit-profile, /chat
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/edit-donation',
  '/edit-profile',
  '/chat',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for Firebase Auth token in Authorization header or as a cookie
    // The auth token should be set by the client after successful login
    const hasAuthToken = 
      request.headers.get('authorization')?.startsWith('Bearer ') ||
      request.cookies.get('authToken')?.value;

    if (!hasAuthToken) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/edit-donation/:path*',
    '/edit-profile/:path*',
    '/chat/:path*',
  ],
};
