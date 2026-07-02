"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Mail, Sparkles, ShieldCheck, HeartHandshake, Globe } from "lucide-react";
import { auth, db, firebaseInitError } from "@/app/firebase";
import { loginUser, sendReset, ProfileMissingError } from "@/controllers/authController";
import { AuthTokenManager } from "@/lib/clientAuth";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Login() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error(t("login.toastResetError"));
      return;
    }
    if (firebaseInitError) {
      toast.error(firebaseInitError);
      return;
    }
    if (!auth) {
      toast.error("Firebase Auth is not initialized.");
      return;
    }

    setIsResetting(true);
    try {
      await sendReset(auth, resetEmail);
      toast.success(t("login.toastResetSent"));
      setShowForgotModal(false);
      setResetEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("login.toastInputError"));
      return;
    }
    if (firebaseInitError) {
      toast.error(firebaseInitError);
      return;
    }
    if (!auth || !db) {
      toast.error("Firebase is not initialized.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save rememberMe preference to localStorage so AuthTokenManager knows where to store client tokens
      if (typeof window !== "undefined") {
        localStorage.setItem("authRememberMe", rememberMe ? "true" : "false");
      }

      const userData = await loginUser(auth, db, email, password, rememberMe);

      // Get ID token and create secure session
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        // Store token in localStorage/sessionStorage for client-side API calls
        AuthTokenManager.setToken(token);
        
        // Create secure httpOnly session cookie via API
        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token, rememberMe }),
        });

        if (!sessionRes.ok) {
          throw new Error("Failed to create session");
        }
      }

      toast.success(t("login.toastSuccess"));
      if (userData && userData.isAdmin) {
        router.push("/admin");
      } else if (userData) {
        router.push("/dashboard");
      } else {
        toast.error("User profile data not found.");
      }
    } catch (err: any) {
      console.error("Login error details:", err);
      if (err instanceof ProfileMissingError) {
        // User authenticated but no profile doc -> redirect to complete profile
        toast.success(t("login.toastSuccess"));
        router.push("/complete-profile");
      } else {
        toast.error(err.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-neutral-950 transition-colors duration-500">
      {/* Left Panel: App Promo Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-900 dark:bg-emerald-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background grids */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-800/40 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-850/40 blur-3xl" />
          <div className="absolute inset-0 hero-grid opacity-10" />
        </div>

        {/* Brand logo */}
        <div className="flex items-center gap-2 z-10">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-900 font-bold text-lg">
            {t("common.logoLetter")}
          </span>
          <span className="text-2xl font-bold tracking-tight">{t("common.brand")}</span>
        </div>

        <div className="space-y-6 z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Together against food waste
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] font-display">
            Rescue Food, Feed Communities
          </h1>
          <p className="text-lg text-emerald-100/90 leading-relaxed font-body">
            Join the Food Waste Reduction Platform. Connect surplus food with organizations and citizens in need. Fast, secure, and impactful.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-emerald-800/60 z-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">{t("login.benefitTitle")}</h4>
              <p className="text-sm text-emerald-200/70 mt-0.5">{t("login.benefit1Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartHandshake className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">{t("login.benefit3Title")}</h4>
              <p className="text-sm text-emerald-200/70 mt-0.5">{t("login.benefit3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Card Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 bg-emerald-50/20 relative">
        
        {/* Back to Home Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="absolute top-6 start-6 text-gray-600 hover:text-emerald-700 flex items-center gap-2 hover:bg-emerald-50/50 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t("common.backToHome")}</span>
        </Button>

        {/* Language switcher button */}
        <Button
          variant="ghost"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="absolute top-6 end-6 text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 hover:bg-emerald-50/50 rounded-xl font-medium px-3 py-2 transition-all duration-200"
        >
          <Globe className="h-4 w-4" />
          <span>{language === "en" ? "العربية" : "English"}</span>
        </Button>

        <div className="mx-auto w-full max-w-md mt-10">
          <div className="bg-white py-10 px-8 sm:px-10 shadow-lg border border-emerald-100 rounded-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t("login.title")}</h2>
              <p className="mt-2 text-sm text-gray-500">{t("login.subtitle")}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <Label htmlFor="email">{t("login.labelEmail")}</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-gray-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.placeholderEmail")}
                    className="ps-10 pe-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl py-5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{t("login.labelPassword")}</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.placeholderPassword")}
                    className="ps-10 pe-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl py-5"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded-md"
                />
                <label htmlFor="remember-me" className="ml-2.5 rtl:ml-0 rtl:mr-2.5 block text-sm text-gray-700 select-none">
                  Remember me on this device
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
              >
                {isSubmitting ? t("login.btnSubmitting") : t("login.btnSubmit")}
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                {t("login.noAccount")}{" "}
                <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  {t("login.signUpLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-emerald-50">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t("login.modalForgotTitle")}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t("login.modalForgotDesc")}
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input
                type="email"
                placeholder={t("login.placeholderEmail")}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="rounded-xl border-gray-200 py-5"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetEmail("");
                  }}
                  className="rounded-xl"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isResetting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {isResetting ? t("login.modalForgotBtnSending") : t("login.modalForgotBtn")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
