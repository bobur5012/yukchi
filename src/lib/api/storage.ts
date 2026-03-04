import { getApiToken } from "./api-token";
import { handleUnauthorized } from "./on-unauthorized";
import { getApiBase } from "./base";

const API_BASE = getApiBase();

export async function uploadAvatar(file: File): Promise<string> {
  const token = getApiToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/storage/upload/avatar`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      handleUnauthorized();
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  if (typeof data?.url === "string") return data.url;
  throw new Error("Invalid response: missing url");
}

export async function uploadProductImage(file: File | Blob): Promise<string> {
  const token = getApiToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/storage/upload/product-image`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      handleUnauthorized();
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data ?? json;
  if (typeof data?.url === "string") return data.url;
  throw new Error("Invalid response: missing url");
}
