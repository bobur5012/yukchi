"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import ru from "@/locales/ru.json";
import uz from "@/locales/uz.json";

type Locale = "ru" | "uz";

const translations: Record<Locale, Record<string, unknown>> = {
  ru: ru as Record<string, unknown>,
  uz: uz as Record<string, unknown>,
};

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function useTranslations() {
  const { locale } = useLocale();
  const data = translations[locale];

  function t(key: string): string {
    if (!data) return key;
    const value = getNested(data as Record<string, unknown>, key);
    return typeof value === "string" ? value : key;
  }

  return { t, locale };
}
