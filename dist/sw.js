/* Simple service worker for NutriScan
   - Pre-caches core assets
   - Serves cached responses when offline
   - Updates cache on activation
*/
const CACHE_NAME = 'nutriscan-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/iconApp.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Put a copy in cache for future
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseClone);
            } catch (e) {
              // ignore put failures for opaque responses
            }
          });
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
