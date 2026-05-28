"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { Locale, TranslationKeys, translations } from "./translations";

interface I18nContextType {
  t: TranslationKeys;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
  t: translations.en,
  locale: "en",
  setLocale: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

function detectLocale(): Locale {
  // Detect from browser language setting
  const lang = navigator.language.toLowerCase();
  if (lang === "id" || lang.startsWith("id-")) return "id";
  return "en";
}

const STORAGE_KEY = "kapita-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  // Default to "en" on server; client will hydrate with the detected locale
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const resolved = stored ?? detectLocale();
    setLocaleState(resolved);
  }, []);

  const setLocale = (next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  };

  return (
    <I18nContext.Provider value={{ t: translations[locale], locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
