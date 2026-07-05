"use client";

import { RTL_LOCALES, type UiLocale } from "@voicevault/shared";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type MessageKey } from "./messages";

interface I18n {
  locale: UiLocale;
  dir: "ltr" | "rtl";
  t(key: MessageKey): string;
  setLocale(locale: UiLocale): void;
}

const I18nContext = createContext<I18n | null>(null);
const LOCALE_KEY = "vv.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "ar") setLocaleState(saved);
  }, []);

  const dir: "ltr" | "rtl" = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const t = useCallback((key: MessageKey) => messages[locale][key] ?? messages.en[key] ?? key, [locale]);
  const setLocale = useCallback((l: UiLocale) => {
    localStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  }, []);

  return <I18nContext.Provider value={{ locale, dir, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}
