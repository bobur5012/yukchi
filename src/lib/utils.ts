import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves a potentially relative avatar URL to an absolute URL.
 * If the backend returns a path like "/uploads/avatar.jpg", prepends the API base URL.
 */
export function getAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
