import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes:
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/edit-donation',
  '/edit-profile',
  '/chat',
];

const authCookieName = 'authToken';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      // Only check for token presence in Edge middleware.
      // Token verification happens in API routes (Node runtime).
      const token = request.cookies.get(authCookieName)?.value ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      if (!token) {
        console.log('No auth token found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();

    } catch (error) {
      console.error('Auth verification failed:', error);
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(authCookieName);
      return response;
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
