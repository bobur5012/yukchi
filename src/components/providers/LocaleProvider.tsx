"use client";

import * as React from "react";

export type Locale = "ru" | "uz";

const LOCALE_KEY = "yukchi_locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = React.createContext<LocaleContextValue | undefined>(
  undefined
);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "ru";
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "uz" || stored === "ru") return stored;
  return "ru";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("ru");

  React.useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const setLocale = React.useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_KEY, newLocale);
    }
  }, []);

  const value = React.useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
