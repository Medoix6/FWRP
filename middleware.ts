import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/app/firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Protect routes: /dashboard, /admin, /edit-donation, /edit-profile, /chat
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/edit-donation',
  '/edit-profile',
  '/chat',
];

const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      // Get token from cookie or Authorization header
      const token = request.cookies.get('authToken')?.value || 
                    request.headers.get('authorization')?.replace('Bearer ', '');

      if (!token) {
        console.log('No auth token found, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // The authToken cookie is a Firebase session cookie created by /api/auth/session.
      // Validate as session cookie first, then fall back to ID token for backward compatibility.
      let decodedToken: DecodedIdToken;
      try {
        decodedToken = await adminAuth.verifySessionCookie(token, true); // checkRevoked = true
      } catch {
        decodedToken = await adminAuth.verifyIdToken(token, true); // legacy ID token support
      }
      
      // Check if this is an admin route
      if (adminRoutes.some(route => pathname.startsWith(route))) {
        // For admin routes, verify admin status from Firestore
        // This will be checked again in the page, but we do a basic check here
        const response = NextResponse.next();
        response.headers.set('x-user-id', decodedToken.uid);
        return response;
      }

      // Add user ID to headers for use in the application
      const response = NextResponse.next();
      response.headers.set('x-user-id', decodedToken.uid);
      return response;

    } catch (error) {
      console.error('Auth verification failed:', error);
      // Token is invalid, expired, or revoked - redirect to login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      // Clear the invalid token
      response.cookies.delete('authToken');
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
