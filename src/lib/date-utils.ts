import { format } from "date-fns";
import { ru, uz } from "date-fns/locale";

export type DateLocale = "ru" | "uz";

const dateLocales = { ru, uz } as const;

/**
 * Форматирует дату. Поддерживает ISO (2026-02-25T09:07:21.089Z) и YYYY-MM-DD.
 * Для YYYY-MM-DD добавляет T12:00:00 чтобы избежать проблем с часовыми поясами.
 */
export function formatDateSafe(
  dateStr: string,
  formatStr: string,
  locale: DateLocale = "ru"
): string {
  if (!dateStr) return "";
  const isIso = dateStr.includes("T");
  const d = isIso ? new Date(dateStr) : new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return format(d, formatStr, { locale: dateLocales[locale] });
}

/** Парсит дату CBU (25.02.2026) в Date */
export function parseCBUDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, day, month, year] = m;
  const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return isNaN(d.getTime()) ? null : d;
}
