// sw.js
const CACHE_NAME = 'kryakbudget-v2.0.2';
const ASSETS = [
  // Основные ресурсы
  'https://dituals758.github.io/mbbla6/',
  'https://dituals758.github.io/mbbla6//index.html',
  'https://dituals758.github.io/mbbla6//styles.css',
  'https://dituals758.github.io/mbbla6//app.js',
  'https://dituals758.github.io/mbbla6//manifest.json',
  
  // Иконки
  'https://dituals758.github.io/mbbla6//icon-192.png',
  'https://dituals758.github.io/mbbla6//icon-512.png',
  'https://dituals758.github.io/mbbla6//icon-iphone.png',
  
  // Внешние ресурсы
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://script.google.com/macros/s/AKfycbxTy8SEdp91qYJET71cto0yhCuoA0q-y5AJkVIKIKzwgLpT_dIgGA-AesxiQRldaYyivg/exec'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Установка версии:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Кеширование основных ресурсов');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Активация версии:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Удаление старого кеша:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Активен новый Service Worker');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Пропускаем POST-запросы и Google Script
  if (event.request.method !== 'GET' || 
      event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const networkFetch = fetch(event.request).then(response => {
          // Клонируем ответ для кеширования
          const responseClone = response.clone();
          
          if (response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              console.log('[SW] Обновление кеша для:', event.request.url);
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });

        return cachedResponse || networkFetch;
      })
      .catch(() => {
        // Fallback для ошибок
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
        return new Response('Оффлайн режим', { 
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data === 'forceUpdate') {
    self.skipWaiting();
    self.clients.claim();
  }
});

// Фоновая синхронизация
self.addEventListener('sync', event => {
  if (event.tag === 'syncTransactions') {
    console.log('[SW] Фоновая синхронизация');
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  // Реализация синхронизации оффлайн-данных
  const pending = await getPendingTransactions();
  await sendToServer(pending);
  await clearPendingTransactions();
}