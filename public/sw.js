const CACHE = "pfm-static-v1";
const PRECACHE_URLS = ["/", "/aggregate", "/month/january", "/month/february", "/month/march", "/month/april", "/month/may", "/month/june", "/month/july", "/month/august", "/month/september", "/month/october", "/month/november", "/month/december", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => {
            // Only cache same-origin successful responses
            try {
              const sameOrigin = new URL(req.url).origin === self.location.origin;
              if (res.ok && sameOrigin) cache.put(req, copy);
            } catch {}
          });
          return res;
        })
        .catch(() => {
          // Offline fallback: try the root
          return caches.match("/");
        });
    })
  );
});
