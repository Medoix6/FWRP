"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please try again. If the issue persists, contact support.
        </p>
        <Button className="mt-4" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
