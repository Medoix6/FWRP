import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes: /dashboard, /admin, /edit-donation, /edit-profile
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/edit-donation',
  '/edit-profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for auth cookie (customize as needed)
    const isLoggedIn = request.cookies.get('authToken');
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/edit-donation/:path*', '/edit-profile/:path*'],
};
