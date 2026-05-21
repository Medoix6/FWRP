import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/app/firebaseAdmin';

/**
 * POST /api/auth/session
 * Creates a secure session cookie with the Firebase ID token
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      );
    }

    // Verify the ID token
    await adminAuth.verifyIdToken(idToken);

    // Create session cookie with 5 days expiration
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });

    // Set httpOnly cookie
    response.cookies.set('authToken', sessionCookie, {
      maxAge: expiresIn / 1000, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const token = request.cookies.get('authToken')?.value;

    // Revoke all refresh tokens for the user if token exists
    if (token) {
      try {
        // Use verifySessionCookie instead of verifyIdToken since authToken is a session cookie
        const decodedToken = await adminAuth.verifySessionCookie(token);
        await adminAuth.revokeRefreshTokens(decodedToken.uid);
      } catch (error) {
        console.error('Failed to revoke tokens:', error);
      }
    }

    const response = NextResponse.json({ success: true });

    // Clear the cookie
    response.cookies.set('authToken', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
