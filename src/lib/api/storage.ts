import { getApiToken } from "./api-token";
import { handleUnauthorized } from "./on-unauthorized";
import { getApiBase } from "./base";
import { refreshAccessToken } from "./client";

const API_BASE = getApiBase();

async function uploadFile(
  path: string,
  file: File | Blob,
  hasRetried = false
): Promise<string> {
  const token = getApiToken();
  const formData = new FormData();
  const filename =
    file instanceof File
      ? file.name
      : `upload.${file.type.split("/")[1] || "bin"}`;
  formData.append("file", file, filename);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    if (!hasRetried) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return uploadFile(path, file, true);
      }
    }
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

export async function uploadAvatar(file: File): Promise<string> {
  return uploadFile("/storage/upload/avatar", file);
}

export async function uploadProductImage(file: File | Blob): Promise<string> {
  return uploadFile("/storage/upload/product-image", file);
}
