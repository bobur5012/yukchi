const DRAFT_PREFIX = "yukchi:draft:";

function getDraftKey(key: string): string {
  return `${DRAFT_PREFIX}${key}`;
}

export function readLocalDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getDraftKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeLocalDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getDraftKey(key), JSON.stringify(value));
  } catch {
    // Ignore storage quota and private mode errors.
  }
}

export function clearLocalDraft(key: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getDraftKey(key));
  } catch {
    // ignore
  }
}
