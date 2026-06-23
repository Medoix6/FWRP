"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/Loading";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "admin";
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (requiredRole === "admin" && !userProfile?.isAdmin) {
        router.replace("/unauthorized");
      }
    }
  }, [user, userProfile, loading, requiredRole, router]);

  if (loading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  if (!user) {
    return null;
  }

  if (requiredRole === "admin" && !userProfile?.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
