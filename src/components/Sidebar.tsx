"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import { auth, db } from "@/app/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Home, Gift, MessageCircle, Settings, Shield, LogOut, X, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  activePath: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  adminContext?: boolean;
}

export default function Sidebar({ 
  activePath, 
  sidebarOpen, 
  setSidebarOpen,
  adminContext = false
}: SidebarProps) {
  const { user, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Listen to unread message count
  useEffect(() => {
    if (!user || !db || adminContext) return;

    const messagesRef = collection(db, "messages");
    const unreadQuery = query(
      messagesRef,
      where("receiverId", "==", user.uid),
      where("status", "in", ["sent", "delivered"])
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user, adminContext]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      toast.error("Failed to sign out.");
    }
  };

  // Safe Fallback Initial Character
  const getFallbackLetter = () => {
    const name = userProfile?.name || userProfile?.fullName;
    if (name && typeof name === "string" && name.length > 0) {
      return name[0].toUpperCase();
    }
    return "?";
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <div
        className={`
          fixed inset-y-0 z-40 w-64 bg-white dark:bg-neutral-900 shadow-sm border-r border-slate-100 dark:border-neutral-800 transform transition-transform duration-300 ease-in-out flex flex-col justify-between
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ltr:left-0 rtl:right-0 ltr:border-r rtl:border-l
        `}
      >
        <div>
          {/* Header section with brand */}
          <div className="p-6 border-b border-slate-50 dark:border-neutral-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg group-hover:scale-105 transition-transform">
                {t("common.logoLetter")}
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t("common.brand")}</span>
            </Link>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-gray-500 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile Summary */}
          <div className="p-6 flex flex-col items-center border-b border-slate-50 dark:border-neutral-800 bg-slate-50/40 dark:bg-neutral-900/40">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-neutral-800 shadow-sm">
              <AvatarImage src={userProfile?.avatar || ""} alt="Avatar" />
              <AvatarFallback className="bg-emerald-100 text-emerald-800 text-lg font-bold">
                {getFallbackLetter()}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 text-center w-full px-2 overflow-hidden">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {userProfile?.name || userProfile?.fullName || "User"}
              </h3>
              <p className="text-xs text-gray-405 truncate mt-0.5">{userProfile?.email || user?.email}</p>
              {userProfile?.isAdmin && (
                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-205">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {adminContext ? (
              // Admin View Context: Only show Admin Dashboard and Admin Profile Settings
              <>
                <Link
                  href="/admin"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/admin"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Shield className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {t("common.adminDashboard")}
                </Link>

                <Link
                  href="/edit-profile?admin=1"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/edit-profile"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {t("common.adminProfileSettings")}
                </Link>
              </>
            ) : (
              // Standard View Context
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/dashboard"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-655 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Home className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {t("common.dashboard")}
                </Link>

                <Link
                  href="/donate-food"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/donate-food"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-655 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Gift className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {t("common.donateFood")}
                </Link>

                <Link
                  href="/chat"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/chat"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-655 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <MessageCircle className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  <span className="flex-1 text-start">{t("common.chat")}</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/edit-profile"
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activePath === "/edit-profile"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                      : "text-gray-655 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {t("common.profileSettings")}
                </Link>

                {userProfile?.isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activePath === "/admin"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rtl:border-l-0 rtl:border-r-4"
                        : "text-gray-655 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                    {t("common.adminDashboard")}
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Footer Logout & Language Switcher */}
        <div className="p-4 border-t border-slate-50 dark:border-neutral-800 space-y-2">
          {/* Language selection button */}
          <Button
            variant="outline"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="w-full justify-start border-slate-200 dark:border-neutral-850 text-gray-650 dark:text-gray-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl py-5 transition-colors duration-200"
          >
            <Globe className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600" />
            {language === "en" ? "العربية" : "English"}
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start border-slate-200 dark:border-neutral-850 text-gray-650 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-950 rounded-xl py-5 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3 text-gray-500 dark:text-gray-400 group-hover:text-red-600" />
            {t("common.signOut")}
          </Button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
