// Custom service worker - push notifications
// @ts-nocheck — Service Worker globals (self, PushEvent, clients) are not in default TS lib
const sw = self as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; data?: { url?: string } } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }
  const title = payload.title ?? "Yukchi";
  const body = payload.body ?? "";
  const url = payload.data?.url ?? "/";
  event.waitUntil(sw.registration.showNotification(title, { body, data: { url }, icon: "/icon.ico", badge: "/icon.ico" }));
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  const fullUrl = new URL(url, sw.location.origin).href;
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(sw.location.origin) && "focus" in client) {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(fullUrl).then(() => client.focus());
          }
          return client.focus();
        }
      }
      return sw.clients.openWindow ? sw.clients.openWindow(fullUrl) : undefined;
    })
  );
});
