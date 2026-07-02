/**
 * Client-side authentication token management
 */

export class AuthTokenManager {
  private static readonly TOKEN_KEY = 'firebaseAuthToken';
  private static readonly EXPIRY_KEY = 'firebaseAuthExpiry';
  private static readonly REMEMBER_KEY = 'authRememberMe';

  private static getStorage(): Storage {
    if (typeof window !== 'undefined') {
      try {
        const remember = localStorage.getItem(this.REMEMBER_KEY) === 'true';
        return remember ? localStorage : sessionStorage;
      } catch (error) {
        console.error('Failed to access storage:', error);
      }
    }
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  static setToken(token: string, expiryMs: number = 3600000): void {
    try {
      const storage = this.getStorage();
      storage.setItem(this.TOKEN_KEY, token);
      storage.setItem(this.EXPIRY_KEY, (Date.now() + expiryMs).toString());
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  static getToken(): string | null {
    try {
      const storage = this.getStorage();
      const token = storage.getItem(this.TOKEN_KEY);
      const expiry = storage.getItem(this.EXPIRY_KEY);

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
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.EXPIRY_KEY);
        localStorage.removeItem(this.REMEMBER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.EXPIRY_KEY);
      }
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
