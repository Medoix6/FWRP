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
import { auth, firebaseInitError } from "@/app/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { AuthTokenManager } from "@/lib/clientAuth";
import toast from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SignupPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = (pwd: string) => {
    // At least 6 characters, 1 uppercase letter, 1 number
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== passwordConfirm) {
      toast.error(t("signup.toastPassMismatch"));
      return;
    }
    if (!passwordValidation(password)) {
      toast.error("Password must be at least 6 characters, include 1 capital letter and 1 number.");
      return;
    }

    // Check if auth is initialized
    if (firebaseInitError) {
      toast.error(firebaseInitError);
      return;
    }
    if (!auth) {
      toast.error("Firebase Auth is not initialized.");
      return;
    }

    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      
      if (token) {
        AuthTokenManager.setToken(token);
        
        // Create session on server
        try {
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          
          if (!sessionResponse.ok) {
            console.warn("Session creation returned non-OK status:", sessionResponse.status);
          }
        } catch (sessionError) {
          console.warn("Failed to create server session:", sessionError);
        }
      }
      
      toast.success(t("signup.toastSuccess"));
      router.push("/complete-profile");
    } catch (error: any) {
      console.error("Error signing up:", error);
      
      // Map FirebaseError code to message
      const errorCode = error?.code;
      switch (errorCode) {
        case "auth/email-already-in-use":
          toast.error("This email is already registered. Please login instead.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address. Please check and try again.");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak. Please use a stronger password.");
          break;
        case "auth/operation-not-allowed":
          toast.error("Signup is currently disabled. Please try again later.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          toast.error("Network error. Please check your connection and try again.");
          break;
        default:
          toast.error(error.message || "An unexpected error occurred during signup.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-neutral-950 transition-colors duration-500">
      {/* Left Panel: Brand panel (Split layout) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-800 to-emerald-950 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative ambient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-2 z-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-800 font-bold text-xl shadow-md">
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
            Start Rescuing Food Today
          </h1>
          <p className="text-lg text-emerald-100/90 leading-relaxed font-body">
            Create an account on the Food Waste Reduction Platform. List food donations or claim meals to help reduction and sustainability.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-emerald-800/60 z-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">{t("signup.benefitTitle")}</h4>
              <p className="text-sm text-emerald-200/70 mt-0.5">{t("signup.benefit2Desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartHandshake className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">{t("signup.benefit3Title")}</h4>
              <p className="text-sm text-emerald-200/70 mt-0.5">{t("signup.benefit3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Signup Form */}
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
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t("signup.title")}</h2>
              <p className="mt-2 text-sm text-gray-500">{t("signup.subtitle")}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <Label htmlFor="email">{t("signup.labelEmail")}</Label>
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
                    placeholder={t("signup.placeholderEmail")}
                    className="ps-10 pe-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl py-5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">{t("signup.labelPassword")}</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ps-10 pe-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl py-5"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters, include 1 uppercase letter and 1 number.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password-confirm">{t("signup.labelConfirmPassword")}</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 start-0 ps-3.5 flex items-center text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <Input
                    id="password-confirm"
                    name="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="ps-10 pe-4 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl py-5"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2"
              >
                {isSubmitting ? t("signup.btnSubmitting") : t("signup.btnSubmit")}
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-600">
                {t("signup.hasAccount")}{" "}
                <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  {t("signup.loginLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
