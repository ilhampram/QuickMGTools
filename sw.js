const CACHE = "quicktools-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon.svg",
  "./favicon-48x48.png",
  "./css/custom.css",
  "./js/app.js",
  "./js/modules/compress.js",
  "./js/modules/resize.js",
  "./js/modules/crop.js",
  "./js/modules/batch.js",
  "./js/modules/paste.js",
  "./js/modules/doctools.js",
  "./js/utils/helpers.js",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => caches.match("./index.html")),
    ),
  );
});
