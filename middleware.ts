import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/app/firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { makeErroringSearchParamsForUseCache } from 'next/dist/server/request/search-params';
import { MarsStroke } from 'lucide-react';
import { Firestore } from 'firebase-admin/firestore';

// Protect routes:
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

      let decodedToken: DecodedIdToken;
      try { 
        decodedToken = await adminAuth.verifySessionCookie(token, true); 
      } catch {
        decodedToken = await adminAuth.verifyIdToken(token, true); 
      }
      
      // Check if this is an admin route
      if (adminRoutes.some(route => pathname.startsWith(route))) {
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
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
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
