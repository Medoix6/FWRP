/**
 * Client-side authentication token management
 */

export class AuthTokenManager {
  private static readonly TOKEN_KEY = 'firebaseAuthToken';
  private static readonly EXPIRY_KEY = 'firebaseAuthExpiry';

  static setToken(token: string, expiryMs: number = 3600000): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.EXPIRY_KEY, (Date.now() + expiryMs).toString());
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  static getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const expiry = localStorage.getItem(this.EXPIRY_KEY);

      if (!token || !expiry) {
        return null;
      }

      // Check if token has expired
      if (Date.now() > parseInt(expiry)) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  static clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.EXPIRY_KEY);
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static getAuthHeader(): { Authorization: string } | null {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  }
}

export function useAuthToken() {
  if (typeof window === 'undefined') {
    return {
      token: null,
      setToken: () => {},
      clearToken: () => {},
      isAuthenticated: () => false,
      getAuthHeader: () => null,
    };
  }

  return {
    token: AuthTokenManager.getToken(),
    setToken: AuthTokenManager.setToken,
    clearToken: AuthTokenManager.clearToken,
    isAuthenticated: AuthTokenManager.isAuthenticated,
    getAuthHeader: AuthTokenManager.getAuthHeader,
  };
}
