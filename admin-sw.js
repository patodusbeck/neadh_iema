const CACHE_NAME = "neadh-admin-v2";
const STATIC_ASSETS = [
  "/admin.html",
  "/admin.css",
  "/admin.js",
  "/admin-manifest.webmanifest",
  "/assets/images/neadh_simbolo.png",
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
    // API sempre em rede para dados atualizados.
    return;
  }

  // Navegação do painel: tenta rede primeiro, fallback para cache.
  if (url.pathname === "/admin.html" || event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/admin.html", copy));
          return response;
        })
        .catch(() => caches.match("/admin.html"))
    );
    return;
  }

  // Stale-while-revalidate para assets estáticos.
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
