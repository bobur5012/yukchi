import { format } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Форматирует дату YYYY-MM-DD без расхождений между сервером и клиентом.
 * Добавляет T12:00:00 чтобы избежать проблем с часовыми поясами при гидратации.
 */
export function formatDateSafe(
  dateStr: string,
  formatStr: string
): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return format(d, formatStr, { locale: ru });
}
