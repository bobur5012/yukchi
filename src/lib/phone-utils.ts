const UZ_PREFIX = "+998 ";

/** Format only the 9 digits after +998 as (XX) XXX-XX-XX */
export function formatPhoneUzSuffix(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 8) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7)}`;
}

/**
 * Format phone number as +998 (77) 777-77-77
 * Extracts digits, assumes Uzbekistan +998 format
 */
export function formatPhoneUz(value: string): string {
  const digits = getPhoneDigits(value);
  if (digits.length <= 3) return digits ? `+${digits}` : "";
  return UZ_PREFIX + formatPhoneUzSuffix(digits.slice(3));
} 

/** Get full value from suffix (9 digits after 998). Handles paste of full number. */
export function getFullPhoneFromSuffix(suffix: string): string {
  let digits = suffix.replace(/\D/g, "");
  if (digits.length > 9) digits = digits.slice(-9);
  else digits = digits.slice(0, 9);
  return UZ_PREFIX + formatPhoneUzSuffix(digits);
}

/** Get raw digits (998XXXXXXXXX) for API/storage */
export function getPhoneDigits(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("90")) {
    digits = "998" + digits;
  }
  if (digits.startsWith("8")) {
    digits = "998" + digits.slice(1);
  }
  return digits.slice(0, 12);
}

/** Check if phone is complete (12 digits) */
export function isPhoneComplete(value: string): boolean {
  return getPhoneDigits(value).length >= 12;
}
