const CACHE_NAME = 'МББЛА6-v6';
const DYNAMIC_CACHE_NAME = 'МББЛА6-dynamic-v6';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

const OFFLINE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Оффлайн</title>
  <style>body{font-family:Arial; text-align:center; padding:20px;}</style>
</head>
<body>
  <h1>Приложение недоступно оффлайн</h1>
  <p>Пожалуйста, проверьте подключение к интернету</p>
</body>
</html>
`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(APP_SHELL).catch(err => {
          console.log('Не удалось закэшировать некоторые ресурсы:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null; // Добавлено явное возвращение для всех веток
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        if (event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return new Response(OFFLINE_HTML, {
          headers: {'Content-Type': 'text/html'}
        });
      });
    })
  );
});