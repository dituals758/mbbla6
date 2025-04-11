const CACHE_NAME = 'kryakBudget-v4';
const ASSETS = [
  'https://dituals758.github.io/mbbla6/',
  'https://dituals758.github.io/mbbla6/index.html',
  'https://dituals758.github.io/mbbla6/styles.css',
  'https://dituals758.github.io/mbbla6/app.js',
  'https://dituals758.github.io/mbbla6/icon-192.png',
  'https://dituals758.github.io/mbbla6/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => 
        key !== CACHE_NAME ? caches.delete(key) : null
      ))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return fetch(e.request);
  
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
      .catch(() => caches.match('/offline.html'))
  );
});

self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-transactions') {
    e.waitUntil(app.syncPendingTransactions());
  }
});