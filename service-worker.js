const CACHE_NAME = "bus-electrico-v11";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

function abrirRecorrido(nombre) {
  ocultarModulos();

  const seccion = document.createElement("section");
  seccion.className = "modulo";
  seccion.innerHTML = `
    <h2>Recorrido ${nombre}</h2>
    <button onclick="mostrarCalle('${nombre}')">📍 Calle a Calle</button>
    <button onclick="mostrarMapa('${nombre}')">🗺 Mapas y Desvíos</button>
    <button onclick="volverRecorridos()">⬅ Volver</button>
  `;

  document.querySelector("main").appendChild(seccion);
}

function volverRecorridos() {
  location.reload();
}










