const API_VERSION_PREFIX = "/api/v1";
const LOCAL_API_BASE = `http://localhost:3000${API_VERSION_PREFIX}`;

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureVersionedBase(value: string): string {
  const normalized = trimTrailingSlashes(value);
  if (normalized.endsWith(API_VERSION_PREFIX)) {
    return normalized;
  }
  return `${normalized}${API_VERSION_PREFIX}`;
}

export function getServerApiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL_INTERNAL ||
    LOCAL_API_BASE;
  return ensureVersionedBase(raw);
}

export function getBrowserApiBase(): string {
  return API_VERSION_PREFIX;
}

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return getServerApiBase();
  }
  return getBrowserApiBase();
}

