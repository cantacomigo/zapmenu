// Service Worker Minimalista para PWA
const CACHE_NAME = 'zapmenu-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Apenas repassa a requisição para a rede para evitar tela branca por cache corrompido
  event.respondWith(fetch(event.request));
});