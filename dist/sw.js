/* Service worker para NutriScan PWA
   - Suporte offline com estratégias de cache inteligentes
   - Pre-cache de assets críticos
   - Cache-first para assets estáticos
   - Network-first para APIs
   - Push notifications
   - Background sync para sincronização offline
*/

const CACHE_NAME = 'nutriscan-cache-v1';
const RUNTIME_CACHE = 'nutriscan-runtime-v1';
const API_CACHE = 'nutriscan-api-v1';
const IMAGE_CACHE = 'nutriscan-images-v1';
const HYDRATION_SETTINGS_CACHE = 'nutriscan-hydration-settings-v1';

const HYDRATION_SETTINGS_KEY = '/hydration-settings';
const HYDRATION_REMINDER_TAG = 'hydration-reminder';
const HYDRATION_DEFAULT_INTERVAL = 2 * 60 * 60 * 1000;

const DEFAULT_HYDRATION_SETTINGS = {
  enabled: false,
  lastDrinkAt: Date.now(),
  intervalMs: HYDRATION_DEFAULT_INTERVAL,
  title: 'Hora de se hidratar',
  body: 'Beba um copo de água para manter o desempenho.'
};

let hydrationSettingsCache = null;

// Assets para fazer pre-cache (carregam na instalação)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/iconApp.png'
];

// APIs que podem ser sincronizadas em background
const SYNC_TAGS = {
  FOOD_SYNC: 'sync-food-items',
  WATER_SYNC: 'sync-water-intake'
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Pre-caching assets críticos');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('Service Worker: Limpando caches antigos');
      return Promise.all(
        keys.map((key) => {
          // Manter caches atuais
          if (![CACHE_NAME, RUNTIME_CACHE, API_CACHE, IMAGE_CACHE, HYDRATION_SETTINGS_CACHE].includes(key)) {
            console.log('Service Worker: Deletando cache antigo:', key);
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para extensões do navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Estratégia diferente para cada tipo de requisição
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    // Images: Cache-first (usar cache, depois rede)
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (url.pathname.startsWith('/api/')) {
    // APIs: Network-first (tentar rede, depois cache)
    event.respondWith(networkFirst(request, API_CACHE));
  } else {
    // HTML/JS/CSS: Cache-first com network fallback
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});

/**
 * Estratégia Cache-first: tenta usar cache primeiro
 */
async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('Service Worker: Cache hit -', request.url);
      return cached;
    }

    const response = await fetch(request);
    
    // Cache response se for bem-sucedida
    if (response && response.status === 200) {
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }

    return response;
  } catch (error) {
    console.warn('Service Worker: Fetch failed -', request.url, error);
    
    // Retorna página offline se disponível
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retorna página HTML fallback
    return await caches.match('/index.html') || new Response(
      'Offline - Página não disponível no cache',
      { status: 503, statusText: 'Service Unavailable' }
    );
  }
}

/**
 * Estratégia Network-first: tenta rede primeiro, depois cache
 */
async function networkFirst(request, cacheName) {
  try {
    console.log('Service Worker: Tentando rede -', request.url);
    const response = await fetch(request);

    // Cache response se for bem-sucedida
    if (response && response.status === 200) {
      const responseClone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }

    return response;
  } catch (error) {
    console.warn('Service Worker: Network failed, usando cache -', request.url);
    
    // Tenta cache como fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retorna resposta genérica offline
    return new Response(
      JSON.stringify({ error: 'Offline - Dados não disponíveis' }),
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

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

self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || !data.type) {
    return;
  }

  if (data.type === 'HYDRATION_SETTINGS_SYNC') {
    const payload = data.payload || {};
    hydrationSettingsCache = {
      ...DEFAULT_HYDRATION_SETTINGS,
      ...payload,
      lastDrinkAt: payload.lastDrinkAt ?? DEFAULT_HYDRATION_SETTINGS.lastDrinkAt,
    };
    event.waitUntil(storeHydrationSettings(hydrationSettingsCache));
  } else if (data.type === 'HYDRATION_LOG_DRINK') {
    const timestamp = data.payload?.timestamp || Date.now();
    hydrationSettingsCache = hydrationSettingsCache || { ...DEFAULT_HYDRATION_SETTINGS };
    hydrationSettingsCache.lastDrinkAt = timestamp;
    event.waitUntil(storeHydrationSettings(hydrationSettingsCache));
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === HYDRATION_REMINDER_TAG) {
    event.waitUntil(handleHydrationPeriodicReminder());
  }
});

// Background Sync para sincronizar dados offline
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === SYNC_TAGS.FOOD_SYNC) {
    event.waitUntil(syncFoodItems());
  } else if (event.tag === SYNC_TAGS.WATER_SYNC) {
    event.waitUntil(syncWaterIntake());
  }
});

/**
 * Sincroniza itens de comida adicionados offline
 */
async function syncFoodItems() {
  try {
    // Tenta enviar dados pendentes ao servidor
    const response = await fetch('http://localhost:5050/api/sync/food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync-pending' })
    });

    if (response.ok) {
      console.log('Food items synced successfully');
      // Notifica cliente sobre sincronização bem-sucedida
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            data: { syncType: 'food', success: true }
          });
        });
      });
    }
  } catch (error) {
    console.error('Error syncing food items:', error);
    // Retry será agendado automaticamente
    throw error;
  }
}

/**
 * Sincroniza ingestão de água adicionada offline
 */
async function syncWaterIntake() {
  try {
    const response = await fetch('http://localhost:5050/api/sync/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync-pending' })
    });

    if (response.ok) {
      console.log('Water intake synced successfully');
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            data: { syncType: 'water', success: true }
          });
        });
      });
    }
  } catch (error) {
    console.error('Error syncing water intake:', error);
    throw error;
  }
}

async function handleHydrationPeriodicReminder() {
  const settings = await getHydrationSettings();
  if (!settings.enabled) {
    return;
  }

  const interval = settings.intervalMs || HYDRATION_DEFAULT_INTERVAL;
  const lastDrinkAt = settings.lastDrinkAt || 0;
  const now = Date.now();

  if (now - lastDrinkAt < interval) {
    return;
  }

  const notificationOptions = {
    body: settings.body,
    icon: '/iconApp.png',
    badge: '/iconApp.png',
    tag: HYDRATION_REMINDER_TAG,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      type: 'hydration-reminder'
    },
    requireInteraction: true
  };

  await self.registration.showNotification(settings.title, notificationOptions);
  hydrationSettingsCache = {
    ...settings,
    lastDrinkAt: now
  };
  await storeHydrationSettings(hydrationSettingsCache);
}

async function getHydrationSettings() {
  if (hydrationSettingsCache) {
    return hydrationSettingsCache;
  }

  const cache = await caches.open(HYDRATION_SETTINGS_CACHE);
  const match = await cache.match(HYDRATION_SETTINGS_KEY);

  if (!match) {
    hydrationSettingsCache = { ...DEFAULT_HYDRATION_SETTINGS };
    return hydrationSettingsCache;
  }

  try {
    const stored = await match.json();
    hydrationSettingsCache = {
      ...DEFAULT_HYDRATION_SETTINGS,
      ...stored
    };
  } catch (error) {
    console.warn('Falha ao ler configurações de hidratação, usando padrão:', error);
    hydrationSettingsCache = { ...DEFAULT_HYDRATION_SETTINGS };
  }

  return hydrationSettingsCache;
}

async function storeHydrationSettings(settings) {
  const cache = await caches.open(HYDRATION_SETTINGS_CACHE);
  const response = new Response(JSON.stringify(settings));
  await cache.put(HYDRATION_SETTINGS_KEY, response);
}
