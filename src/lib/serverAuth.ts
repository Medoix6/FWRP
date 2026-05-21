/**
 * Server-side authentication verification utilities
 */

import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/app/firebaseAdmin';
import { AuthenticationError, ForbiddenError } from './apiError';

type AuthTokenSource = 'authorization' | 'session-cookie';

export async function verifyIdToken(token: string, checkRevoked = true) {
  if (!token) {
    throw new AuthenticationError('No token provided');
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token, checkRevoked);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new AuthenticationError('Invalid or expired token');
  }
}

export function getAuthTokenFromRequest(request: NextRequest): { token: string; source: AuthTokenSource } {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7), source: 'authorization' };
  }

  const cookieToken = request.cookies.get('authToken')?.value;
  if (cookieToken) {
    return { token: cookieToken, source: 'session-cookie' };
  }

  throw new AuthenticationError('Missing authentication token');
}

export async function verifyRequestAuth(request: NextRequest) {
  const { token, source } = getAuthTokenFromRequest(request);
  if (source === 'session-cookie') {
    try {
      const adminAuth = getAdminAuth();
      return await adminAuth.verifySessionCookie(token, true);
    } catch (error) {
      console.error('Session cookie verification failed:', error);
      throw new AuthenticationError('Invalid or expired session');
    }
  }

  return verifyIdToken(token);
}

export async function verifyAdminAuth(request: NextRequest) {
  const decodedToken = await verifyRequestAuth(request);
  
  // Check if user is admin
  const adminDb = getAdminDb();
  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }

  return decodedToken;
}

export async function getUserFromAuth(request: NextRequest) {
  const decodedToken = await verifyRequestAuth(request);
  
  // Get user data from Firestore
  const adminDb = getAdminDb();
  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  
  if (!userDoc.exists) {
    throw new AuthenticationError('User profile not found');
  }

  return {
    uid: decodedToken.uid,
    ...userDoc.data(),
  };
}
