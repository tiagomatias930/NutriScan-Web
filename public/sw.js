/* Simple service worker for NutriScan
   - Pre-caches core assets
   - Serves cached responses when offline
   - Updates cache on activation
   - Handles push notifications
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

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação NutriScan',
      icon: data.icon || '/iconApp.png',
      badge: data.badge || '/iconApp.png',
      tag: data.tag || 'nutriscan-notification',
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: data.customData || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'NutriScan', options)
    );
  } catch (e) {
    console.error('Error parsing push data:', e);
    // Fallback for non-JSON push data
    event.waitUntil(
      self.registration.showNotification('NutriScan', {
        body: event.data.text ? event.data.text() : 'Nova notificação',
        icon: '/iconApp.png',
        badge: '/iconApp.png'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
