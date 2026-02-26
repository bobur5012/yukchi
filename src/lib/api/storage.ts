import { getApiToken } from "./api-token";
import { handleUnauthorized } from "./on-unauthorized";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:3000") + "/api/v1";

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
