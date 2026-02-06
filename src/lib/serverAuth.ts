/**
 * Server-side authentication verification utilities
 */

import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/app/firebaseAdmin';
import { AuthenticationError, ForbiddenError } from './apiError';

export async function verifyIdToken(token: string) {
  if (!token) {
    throw new AuthenticationError('No token provided');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new AuthenticationError('Invalid or expired token');
  }
}

export async function getAuthTokenFromRequest(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  return token;
}

export async function verifyRequestAuth(request: NextRequest) {
  const token = await getAuthTokenFromRequest(request);
  return verifyIdToken(token);
}

export async function verifyAdminAuth(request: NextRequest) {
  const decodedToken = await verifyRequestAuth(request);
  
  // Check if user is admin
  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  
  if (!userDoc.exists || !userDoc.data()?.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }

  return decodedToken;
}

export async function getUserFromAuth(request: NextRequest) {
  const decodedToken = await verifyRequestAuth(request);
  
  // Get user data from Firestore
  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
  
  if (!userDoc.exists) {
    throw new AuthenticationError('User profile not found');
  }

  return {
    uid: decodedToken.uid,
    ...userDoc.data(),
  };
}
