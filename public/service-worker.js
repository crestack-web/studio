const CACHE_NAME = 'busmo-v2';
const STATIC_CACHE = 'busmo-static-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.log('Failed to cache static assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - minimal caching, mostly pass-through
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache manifest.json
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
    return;
  }

  // All other requests - pass through to network
  event.respondWith(fetch(event.request).catch(() => {
    // If network fails, try cache as fallback
    return caches.match(event.request);
  }));
});
