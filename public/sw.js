const CACHE_NAME = 'zapmenu-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estratégia simples: tenta buscar na rede, se falhar (offline), tenta o cache.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});