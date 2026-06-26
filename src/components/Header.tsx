"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import { LogOut, LayoutDashboard, User, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-emerald-100/80 dark:border-neutral-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group transition-transform hover:scale-[1.01] active:scale-[0.99]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-600/10">
              {t("common.logoLetter")}
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t("common.brand")}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switch Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl px-2 sm:px-3 flex items-center gap-1.5 font-medium transition-all duration-200"
              title={language === "en" ? "تغيير اللغة إلى العربية" : "Switch language to English"}
            >
              <Globe className="h-4 w-4 text-gray-500 group-hover:text-emerald-600" />
              <span className="text-xs sm:text-sm">{language === "en" ? "العربية" : "English"}</span>
            </Button>

            {loading ? (
              // Subtle Skeleton state to prevent layout shift
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-9 w-16 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded-lg" />
                <div className="h-9 w-20 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded-lg" />
              </div>
            ) : user ? (
              // Authenticated User Menu
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/dashboard" passHref>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all duration-200">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("common.dashboard")}</span>
                  </Button>
                </Link>

                <Link href="/edit-profile" passHref>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl" title={t("header.profileSettingsTitle")}>
                    <User className="h-4 w-4" />
                  </Button>
                </Link>

                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 rounded-xl transition-all duration-200">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">{t("common.logOut")}</span>
                </Button>
              </div>
            ) : (
              // Unauthenticated Actions
              <div className="flex items-center gap-2">
                <Link href="/login" passHref>
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl font-semibold">
                    {t("common.login")}
                  </Button>
                </Link>
                <Link href="/signup" passHref>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg font-semibold transition-all duration-200">
                    {t("common.signUp")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
