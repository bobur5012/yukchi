import { api } from "./client";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? "" : "http://localhost:3000")) +
  "/api/v1";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/push/vapid-public`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to get VAPID key");
  const json = await res.json();
  return json.vapidPublicKey ?? json.data?.vapidPublicKey ?? "";
}

export async function subscribePush(subscription: PushSubscriptionPayload): Promise<void> {
  await api.post("/push/subscribe", subscription);
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await api.delete("/push/subscribe", { endpoint });
}
