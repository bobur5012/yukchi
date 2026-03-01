import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an avatar URL through the local image proxy (/api/proxy-avatar).
 *
 * - Absolute URLs (http/https) from private S3 storage → proxied so the server
 *   can add an Authorization header (browser <img> cannot do this).
 * - Relative paths (/uploads/...) → resolved against the API base, then proxied.
 * - data: URLs → returned as-is (no proxy needed).
 */
export function getAvatarUrl(url?: string | null, version?: string | number): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;

  let fullUrl: string;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    fullUrl = url;
  } else {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fullUrl = `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  const v = version != null ? `&v=${encodeURIComponent(String(version))}` : "";
  return `/api/proxy-avatar?url=${encodeURIComponent(fullUrl)}${v}`;
}
