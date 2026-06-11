/* TrueLabel Service Worker — Offline-Zugriff auf App-Shell und
   zuletzt geöffnete Produkte (network-first, Cache als Fallback). */

const VERSION = "tl-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Statische Next-Assets: cache-first (haben gehashte Dateinamen)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Auth/Stripe/Admin nie cachen
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/premium") ||
    url.pathname.startsWith("/api/admin")
  ) {
    return;
  }

  // Seiten & Produkt-API: network-first, Cache als Offline-Fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match("/")))
  );
});
