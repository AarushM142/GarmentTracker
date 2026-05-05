const CACHE_NAME = 'garment-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/favicon.ico',
  // Next.js chunks will be cached dynamically
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for assets
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          // Cache new assets dynamically (JS, CSS, Images)
          if (response.status === 200 && (
            event.request.url.includes('_next/static') || 
            event.request.url.includes('.png') ||
            event.request.url.includes('.jpg')
          )) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline and not in cache, return the cached index for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
