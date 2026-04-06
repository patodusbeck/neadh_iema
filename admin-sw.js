const CACHE_NAME = "neadh-admin-v3";
const STATIC_ASSETS = [
  "/admin",
  "/admin.html",
  "/admin.css",
  "/admin.js",
  "/admin-manifest.webmanifest",
  "/assets/images/ipcarolina.png",
  "/assets/icons/pwa-192.png",
  "/assets/icons/pwa-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.pathname === "/admin" || url.pathname === "/admin.html" || event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copyA = response.clone();
          const copyB = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("/admin", copyA);
            cache.put("/admin.html", copyB);
          });
          return response;
        })
        .catch(() => caches.match("/admin") || caches.match("/admin.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
