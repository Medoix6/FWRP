"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setOffline(!navigator.onLine);

    const on = () => setOffline(false);
    const off = () => setOffline(true);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#F4A261] text-white py-3 px-6 z-[9000] text-sm font-semibold flex items-center justify-center gap-2 shadow-lg border-t border-[#e28d48] animate-slide-up"
      role="alert"
    >
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re currently offline. Any changes will sync once you reconnect.</span>
    </div>
  );
}
