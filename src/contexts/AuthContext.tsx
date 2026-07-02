"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/firebase";
import { AuthTokenManager } from "@/lib/clientAuth";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let profileUnsub = () => {};

    const authUnsub = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Sync token to cookie
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const expiryMs = Math.max(0, new Date(tokenResult.expirationTime).getTime() - Date.now());
          AuthTokenManager.setToken(tokenResult.token, expiryMs);
          
          // Call API to set session cookie
          const rememberMe = typeof window !== 'undefined' && localStorage.getItem('authRememberMe') === 'true';
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: tokenResult.token, rememberMe }),
          });
        } catch (error) {
          console.error("Failed to sync auth token:", error);
        }

        // Real-time listener on user profile
        profileUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            setUserProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoading(false);
          },
          (error) => {
            console.error("Profile listener error:", error);
            setLoading(false);
          }
        );
      } else {
        profileUnsub();
        setUserProfile(null);
        AuthTokenManager.clearToken();
        
        // Clear session cookie
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      profileUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
