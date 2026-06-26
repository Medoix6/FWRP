"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, Sparkles, TrendingUp, ShieldCheck, Clock, MapPin, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Hero() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-lime-50/30 to-white dark:from-neutral-950 dark:via-neutral-900/20 dark:to-neutral-950 transition-colors duration-500">
      {/* Background blobs and grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/30 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-lime-200/30 dark:bg-lime-500/5 blur-3xl" />
        <div className="absolute inset-0 hero-grid opacity-60 dark:opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center py-16 sm:py-20 lg:py-24">
          
          {/* Hero Left Content */}
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 dark:border-emerald-950 bg-white/90 dark:bg-neutral-900/90 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 shadow-sm transition-all duration-300">
              <Sparkles className="h-4 w-4 animate-pulse text-emerald-500" />
              {t("hero.badge")}
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gray-900 dark:text-white leading-tight tracking-tight">
                {t("hero.title")}{" "}
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {t("hero.titleAccent")}
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                {t("hero.description")}
              </p>
            </div>

            {/* Dynamic CTAs based on login state */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {user ? (
                <Link href="/dashboard" passHref className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 py-5 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all font-semibold">
                    {t("hero.btnDashboard")}
                  </Button>
                </Link>
              ) : (
                <Link href="/signup" passHref className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 py-5 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all font-semibold">
                    {t("hero.btnGetStarted")}
                  </Button>
                </Link>
              )}
              
              <Link href="/learn-more" passHref className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-5 text-base border-emerald-200/80 dark:border-neutral-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-neutral-900/50 rounded-2xl font-semibold transition-all duration-200"
                >
                  {t("hero.btnSeeHow")}
                </Button>
              </Link>
            </div>

            {/* Features summary row */}
            <div className="grid gap-4 sm:grid-cols-3 text-sm pt-4">
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-emerald-100/50 dark:border-neutral-800/50 px-4 py-3 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <p className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {t("hero.featRealTime")}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{t("hero.featRealTimeDesc")}</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-emerald-100/50 dark:border-neutral-800/50 px-4 py-3 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <p className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {t("hero.featVerified")}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{t("hero.featVerifiedDesc")}</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-emerald-100/50 dark:border-neutral-800/50 px-4 py-3 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <p className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  {t("hero.featEco")}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{t("hero.featEcoDesc")}</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: High-Fidelity App Mockups */}
          <div className="relative h-[480px] w-full flex items-center justify-center animate-fade-in-right">
            
            {/* Core Mockup: Active Food Listing */}
            <div className="w-[340px] rounded-3xl border border-emerald-100/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-5 shadow-2xl relative z-10 transition-all duration-300 hover:scale-[1.01] hover:shadow-emerald-950/5">
              
              {/* Listing Card Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg">
                  {t("hero.mockupBakery")}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("hero.mockupAvailable")}
                </span>
              </div>

              {/* Listing Image Mockup */}
              <div className="h-36 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-neutral-800 dark:to-neutral-850 flex items-center justify-center overflow-hidden mb-4 relative group">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                <span className="text-3xl">🍞</span>
                {/* Floating details */}
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-xl px-3 py-1.5 flex justify-between text-xs shadow-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{t("hero.mockupQty")}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-amber-600 font-bold">{t("hero.mockupSavedRatio")}</span>
                </div>
              </div>

              {/* Listing Details */}
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {t("hero.mockupTitle")}
                </h3>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{t("hero.mockupSub")}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-xl w-fit">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{t("hero.mockupPickup")}</span>
                </div>

                {/* Micro Action Bar */}
                <div className="pt-2 flex gap-2">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9">
                    {t("hero.mockupClaimBtn")}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl border-emerald-100 hover:bg-emerald-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-emerald-700 dark:text-emerald-400 text-xs h-9">
                    {t("hero.mockupDetailsBtn")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Back Mockup: Savings Counter */}
            <div className="absolute right-0 bottom-6 w-[220px] rounded-2xl border border-lime-100/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-900/90 p-4 shadow-xl z-20 animate-float-subtle">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-8 w-8 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-lime-700 dark:text-lime-400 flex items-center justify-center">
                  <TrendingUp className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("hero.mockupMonthly")}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t("hero.mockupEcoSavings")}</p>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-neutral-800">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t("hero.mockupCarbon")}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t("hero.mockupCarbonVal")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t("hero.mockupMeals")}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t("hero.mockupMealsVal")}</span>
                </div>
                {/* Visual tiny bar indicator */}
                <div className="w-full bg-lime-100/50 dark:bg-neutral-800 rounded-full h-1 overflow-hidden mt-1">
                  <div className="bg-lime-500 h-full w-4/5 rounded-full" />
                </div>
              </div>
            </div>

            {/* Top Mockup: Fast Pickup Alert */}
            <div className="absolute left-[-20px] top-6 w-[200px] rounded-2xl border border-emerald-100/60 dark:border-neutral-850/60 bg-white/90 dark:bg-neutral-900/90 p-3 shadow-xl z-0 animate-float-subtle" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{t("hero.mockupConfirmed")}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500">{t("hero.mockupRoute")}</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
