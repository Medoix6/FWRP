/**
 * Client-side logout utility
 * Handles complete logout including server session, client auth, and local storage
 */

import { auth } from '@/app/firebase';
import { AuthTokenManager } from './clientAuth';

export async function logout() {
  try {
    // 1. Clear server-side session cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
    
    // 2. Sign out from Firebase client
    await auth.signOut();
    
    // 3. Clear client-side token storage
    AuthTokenManager.clearToken();
    
    // 4. Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to redirect to login
    window.location.href = "/login";
  }
}
