"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, HeartHandshake, ShieldCheck, BadgeAlert, Sparkles, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CallToAction() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-emerald-700 dark:bg-emerald-900 transition-colors duration-500">
      <div className="absolute inset-0 hero-grid opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center">
          
          {/* CTA Left Column: Message & Checkpoints */}
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/60 border border-emerald-500 px-3 py-1 text-xs text-lime-200">
              <Sparkles className="h-3.5 w-3.5" />
              {t("cta.badge")}
            </div>
            
            <h2 className="font-display text-3xl sm:text-4xl leading-tight">
              {t("cta.heading")}
            </h2>
            <p className="text-lg text-emerald-100 max-w-xl leading-relaxed">
              {t("cta.description")}
            </p>
            
            {/* Checklist */}
            <div className="grid gap-3 sm:grid-cols-2 text-sm pt-2">
              {[
                t("cta.check1"), 
                t("cta.check2"), 
                t("cta.check3"), 
                t("cta.check4")
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-lime-300 flex-shrink-0" />
                  <span className="font-medium text-emerald-50">{item}</span>
                </div>
              ))}
            </div>

            {/* Dynamic Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {user ? (
                <Link href="/donate-food" passHref className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl shadow-lg shadow-emerald-950/10 font-bold transition-all duration-200">
                    {t("cta.btnDonate")}
                  </Button>
                </Link>
              ) : (
                <Link href="/signup" passHref className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-800 rounded-2xl shadow-lg shadow-emerald-950/10 font-bold transition-all duration-200">
                    {t("cta.btnSignUp")}
                  </Button>
                </Link>
              )}
              <Link href="/learn-more" passHref className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-white/30 hover:border-white/50 text-white hover:bg-white/10 rounded-2xl font-bold transition-all duration-200">
                  {t("cta.btnSeeHow")}
                </Button>
              </Link>
            </div>
          </div>

          {/* CTA Right Column: Visual Dashboard Mockup */}
          <div className="rounded-3xl bg-white/10 dark:bg-black/20 border border-white/20 p-6 shadow-xl relative transition-transform hover:scale-[1.01] duration-300">
            <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-gray-155 dark:border-neutral-800 p-5 space-y-4">
              
              {/* Snapshot header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{t("cta.mockupActive")}</p>
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">{t("cta.mockupTitle")}</h4>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {t("cta.mockupReserved")}
                </span>
              </div>

              {/* Snapshot details */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">{t("cta.mockupLabelItems")}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-205">{t("cta.mockupItems")}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">{t("cta.mockupLabelDonor")}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-205">{t("cta.mockupDonor")}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">{t("cta.mockupLabelRecipient")}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-205">{t("cta.mockupRecipient")}</span>
                </div>

                {/* Pickup badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-neutral-955 border border-gray-100 dark:border-neutral-850">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{t("cta.mockupScheduled")}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t("cta.mockupScheduledVal")}</span>
                </div>

                {/* Eco Impact stats */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 border border-emerald-100/50 dark:border-emerald-950/50 text-center">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">{t("cta.mockupWeight")}</p>
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-350">{t("cta.mockupWeightVal")}</p>
                  </div>
                  <div className="rounded-xl bg-lime-50/50 dark:bg-lime-950/20 px-3 py-2 border border-lime-100/50 dark:border-lime-950/50 text-center">
                    <p className="text-[10px] text-lime-700 dark:text-lime-400 font-bold uppercase">{t("cta.mockupOffset")}</p>
                    <p className="text-sm font-black text-lime-800 dark:text-lime-350">{t("cta.mockupOffsetVal")}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
