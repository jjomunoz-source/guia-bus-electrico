const CACHE_NAME = "guia-stu-v18";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./logo-stu.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        return response;
      })
      .catch(() => caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      }))
  );
});
