"use client";

import { useState, useCallback, useEffect } from "react";
import { getVapidPublicKey, subscribePush, unsubscribePush } from "@/lib/api/push";

export type PushPermission = "default" | "granted" | "denied";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in navigator &&
      "Notification" in window;
    setIsSupported(!!ok);
    if (ok && "Notification" in window) {
      setPermission(Notification.permission as PushPermission);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);
    return result === "granted";
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setLoading(true);
    setError(null);
    try {
      const granted = await requestPermission();
      if (!granted) {
        setError("permission_denied");
        return false;
      }
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        setError("vapid_unavailable");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const keyBytes = urlBase64ToUint8Array(vapidKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes as unknown as BufferSource,
      });
      const payload = sub.toJSON();
      await subscribePush({
        endpoint: payload.endpoint!,
        keys: {
          p256dh: payload.keys?.p256dh ?? "",
          auth: payload.keys?.auth ?? "",
        },
      });
      setIsSubscribed(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "subscribe_failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await unsubscribePush(sub.endpoint);
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "unsubscribe_failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
