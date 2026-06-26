"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-emerald-100 flex flex-col items-center">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("unauthorized.title")}</h1>
        <p className="text-gray-600 mb-6">
          {t("unauthorized.description")}
        </p>
        <div className="flex gap-4 w-full">
          <Button
            variant="outline"
            className="flex-1 border-emerald-200 text-gray-700 hover:bg-emerald-50"
            onClick={() => router.push("/dashboard")}
          >
            {t("unauthorized.btnDashboard")}
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => router.push("/login")}
          >
            {t("unauthorized.btnLogin")}
          </Button>
        </div>
      </div>
    </div>
  );
}
