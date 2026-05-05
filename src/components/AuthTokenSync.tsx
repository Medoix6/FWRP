"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/app/firebase";
import { AuthTokenManager } from "@/lib/clientAuth";

export default function AuthTokenSync() {
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        AuthTokenManager.clearToken();
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const expiryMs = Math.max(0, new Date(tokenResult.expirationTime).getTime() - Date.now());
        AuthTokenManager.setToken(tokenResult.token, expiryMs);
      } catch (error) {
        console.error("Failed to sync auth token:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
