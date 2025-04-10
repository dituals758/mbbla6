const CACHE_NAME = 'finance-v4';
const ASSETS = [
  'https://dituals758.github.io/mbbla6/',
  'https://dituals758.github.io/mbbla6/index.html',
  'https://dituals758.github.io/mbbla6/style.css',
  'https://dituals758.github.io/mbbla6/app.js',
  'https://dituals758.github.io/mbbla6/manifest.json',
  'https://dituals758.github.io/mbbla6/icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Обновляем кеш при успешном запросе
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        
        // Возвращаем кешированную версию сразу, затем обновляем
        return cachedResponse || fetchPromise;
      })
  );
});

// Фоновая синхронизация при обновлении контента
self.addEventListener('message', (event) => {
  if (event.data === 'update') {
    self.registration.update();
  }
});