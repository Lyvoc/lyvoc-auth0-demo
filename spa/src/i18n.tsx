import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Display language of the portal (en / fr): chosen in the sidebar, kept in
 * the browser (localStorage), else the browser's language, else English.
 * Also sent to Auth0 (ui_locales, see auth.ts) so the login pages follow it.
 *
 * Translations live next to the component that shows them:
 *
 *   const MESSAGES = defineMessages({ title: "Welcome", hello: (name: string) => `Hello ${name}` }, { title: "Bienvenue", hello: (name) => `Bonjour ${name}` });
 *   const m = useMessages(MESSAGES); // m.title, m.hello("Alice")
 *
 * The French dictionary must have every key of the English one (type-checked);
 * a value can be a string, or a function returning a string or JSX.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = { en: "English", fr: "Français" };

const STORAGE_KEY = "demo-locale";

const toLocale = (value: unknown): Locale | undefined => {
  if (typeof value !== "string") return undefined;
  const language = value.trim().toLowerCase().split(/[-_]/)[0];
  return LOCALES.find((locale) => locale === language);
};

const initialLocale = (): Locale => {
  try {
    const stored = toLocale(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Storage blocked: the browser's language
  }
  for (const language of navigator.languages ?? [navigator.language]) {
    const locale = toLocale(language);
    if (locale) return locale;
  }
  return "en";
};

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void };

const LanguageContext = createContext<LanguageContextValue>({ locale: "en", setLocale: () => {} });

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not kept: this page only
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

/** Current language, outside React (Auth0 login parameters). */
export const currentLocale = (): Locale => {
  try {
    return toLocale(window.localStorage.getItem(STORAGE_KEY)) ?? initialLocale();
  } catch {
    return initialLocale();
  }
};

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] };

export type Messages<T> = { en: T; fr: Widen<T> };

/** English and French dictionaries of a component (same keys). */
export function defineMessages<T extends Record<string, unknown>>(en: T, fr: Widen<T>): Messages<T> {
  return { en, fr };
}

/** The dictionary of the current language. */
export function useMessages<T>(messages: Messages<T>): Widen<T> {
  const { locale } = useLanguage();
  return messages[locale] as Widen<T>;
}

/** Dates and numbers in the current language. */
export const formatDate = (value: string | number | Date, locale: Locale) => new Date(value).toLocaleString(locale);
