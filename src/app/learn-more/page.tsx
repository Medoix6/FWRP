"use client";

import Link from "next/link"
import { ArrowLeft, Leaf, Recycle, Truck, Users, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"

export default function LearnMore() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-800">
            <ArrowLeft className="mr-2 h-5 w-5 rtl:rotate-180" />
            {t("common.backToHome")}
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="text-emerald-700 hover:bg-emerald-50/50 rounded-xl px-3 flex items-center gap-1.5 font-medium transition-all duration-200"
          >
            <Globe className="h-4 w-4" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </Button>
        </div>

        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">{t("learnMore.title")}</p>
            <h1 className="font-display text-4xl sm:text-5xl text-gray-900 leading-tight">
              {t("learnMore.heading")}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t("learnMore.description")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{t("learnMore.box1Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.box1Desc")}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{t("learnMore.box2Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.box2Desc")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-72 w-full object-cover"
              src="/img/hero-illustration.svg"
              alt="Food rescue illustration"
            />
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: t("learnMore.card1Title"),
              copy: t("learnMore.card1Desc"),
              icon: Users,
            },
            {
              title: t("learnMore.card2Title"),
              copy: t("learnMore.card2Desc"),
              icon: Leaf,
            },
            {
              title: t("learnMore.card3Title"),
              copy: t("learnMore.card3Desc"),
              icon: Recycle,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">{t("learnMore.sectionWays")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{t("learnMore.way1Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.way1Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Recycle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{t("learnMore.way2Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.way2Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center flex-shrink-0">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{t("learnMore.way3Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.way3Desc")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{t("learnMore.way4Title")}</p>
                <p className="text-sm text-gray-600 mt-1">{t("learnMore.way4Desc")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

