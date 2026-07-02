"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Leaf, Recycle, Truck, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LearnMore() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-500">
      <Header />
      
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors gap-2 text-sm">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            <span>{t("common.backToHome")}</span>
          </Link>
        </div>

        <section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t("learnMore.title")}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {t("learnMore.heading")}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-body">
              {t("learnMore.description")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 dark:border-neutral-900 bg-emerald-50/20 dark:bg-neutral-900/30 px-5 py-4 shadow-sm transition-colors duration-300">
                <p className="font-semibold text-gray-900 dark:text-white">{t("learnMore.box1Title")}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">{t("learnMore.box1Desc")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 dark:border-neutral-900 bg-emerald-50/20 dark:bg-neutral-900/30 px-5 py-4 shadow-sm transition-colors duration-300">
                <p className="font-semibold text-gray-900 dark:text-white">{t("learnMore.box2Title")}</p>
                <p className="text-sm text-gray-650 dark:text-gray-400 mt-1.5">{t("learnMore.box2Desc")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 dark:border-neutral-900 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden aspect-[4/3] relative flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-950/20 dark:to-lime-950/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-full w-full object-contain max-h-[300px] transition-transform hover:scale-105 duration-500"
              src="/img/hero-illustration.svg"
              alt="Food rescue illustration"
            />
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: t("learnMore.card1Title"),
              copy: t("learnMore.card1Desc"),
              icon: Users,
              bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
              text: "text-emerald-700 dark:text-emerald-400",
            },
            {
              title: t("learnMore.card2Title"),
              copy: t("learnMore.card2Desc"),
              icon: Leaf,
              bg: "bg-teal-50/50 dark:bg-teal-950/10",
              text: "text-teal-700 dark:text-teal-400",
            },
            {
              title: t("learnMore.card3Title"),
              copy: t("learnMore.card3Desc"),
              icon: Recycle,
              bg: "bg-lime-50/50 dark:bg-lime-950/10",
              text: "text-lime-700 dark:text-lime-400",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-emerald-100/60 dark:border-neutral-900 bg-white dark:bg-neutral-900 p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className={`h-12 w-12 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-body">{item.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-emerald-100/60 dark:border-neutral-900 bg-emerald-50/10 dark:bg-neutral-900/10 p-8 sm:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("learnMore.sectionWays")}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{t("learnMore.way1Title")}</p>
                <p className="text-sm text-gray-650 dark:text-gray-400 mt-1.5 leading-relaxed">{t("learnMore.way1Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Recycle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{t("learnMore.way2Title")}</p>
                <p className="text-sm text-gray-655 dark:text-gray-400 mt-1.5 leading-relaxed">{t("learnMore.way2Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 dark:bg-lime-950/45 text-lime-700 dark:text-lime-400 flex items-center justify-center flex-shrink-0">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{t("learnMore.way3Title")}</p>
                <p className="text-sm text-gray-650 dark:text-gray-400 mt-1.5 leading-relaxed">{t("learnMore.way3Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 dark:bg-lime-950/45 text-lime-700 dark:text-lime-400 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-white">{t("learnMore.way4Title")}</p>
                <p className="text-sm text-gray-650 dark:text-gray-400 mt-1.5 leading-relaxed">{t("learnMore.way4Desc")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
