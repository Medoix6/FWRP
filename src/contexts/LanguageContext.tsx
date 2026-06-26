"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/utils/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const storedLang = localStorage.getItem("language") as Language;
    if (storedLang === "en" || storedLang === "ar") {
      setLanguageState(storedLang);
    } else {
      // Check browser default
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "ar") {
        setLanguageState("ar");
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  useEffect(() => {
    if (!mounted) return;
    
    // Apply lang and dir attributes to html element
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    
    // Add or remove rtl class for tailwind styling options
    if (language === "ar") {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
  }, [language, mounted]);

  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split(".");
    let current: any = translations[language];
    
    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English if translation is missing in the target language
        let enCurrent: any = translations.en;
        for (const enK of keys) {
          if (enCurrent && enCurrent[enK] !== undefined) {
            enCurrent = enCurrent[enK];
          } else {
            enCurrent = undefined;
            break;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : (defaultValue || key);
      }
    }
    
    return typeof current === "string" ? current : (defaultValue || key);
  };

  const isRTL = language === "ar";

  // Prevent flash of un-translated content by matching SSR structure initially
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
