"use client";

import { Leaf, Users, Utensils, Recycle, HandHeart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Features() {
  const { t } = useLanguage();

  const features = [
    {
      name: t("features.ecoName"),
      description: t("features.ecoDesc"),
      icon: Leaf,
    },
    {
      name: t("features.communityName"),
      description: t("features.communityDesc"),
      icon: Users,
    },
    {
      name: t("features.distName"),
      description: t("features.distDesc"),
      icon: Utensils,
    },
    {
      name: t("features.impactName"),
      description: t("features.impactDesc"),
      icon: Recycle,
    },
    {
      name: t("features.careName"),
      description: t("features.careDesc"),
      icon: HandHeart,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {t("features.badge")}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight">
            {t("features.heading")}
          </h2>
        </div>

        {/* Features Card Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-3xl border border-emerald-100/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-800"
            >
              <div className="flex items-start gap-4">
                {/* Feature Icon Container */}
                <div className="h-12 w-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950 text-emerald-755 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-600 transition-colors duration-300">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                {/* Feature Details */}
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {feature.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
