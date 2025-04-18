const APP_VERSION = '2.0.1';
const CACHE_NAME = `kryakBudget-${APP_VERSION}`;
const RUNTIME_CACHE = 'runtime-cache';
const OFFLINE_URL = './offline.html';
const ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-256.png',
  './icons/icon-512.png',
  './js/config.js',
  './js/dom-elements.js',
  './js/state.js',
  './js/utils.js',
  './js/service-worker.js',
  './js/transactions.js',
  './js/stats.js',
  './js/ui.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS)
          .then(() => self.skipWaiting())
          .catch(err => console.error('Cache addAll error:', err));
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      }))
    ).then(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'VERSION_UPDATE',
            version: APP_VERSION,
            date: new Date().toISOString()
          });
        });
      });
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => cache.put(event.request, clone));
            return networkResponse;
          })
          .catch(() => caches.match(OFFLINE_URL));

        return cachedResponse || fetchPromise;
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      self.clients.matchAll({type: 'window'})
        .then(windowClients => {
          if (windowClients.length > 0) {
            windowClients[0].postMessage({
              type: 'SYNC_TRANSACTIONS'
            });
          }
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_VERSION') {
    event.source.postMessage({
      type: 'CURRENT_VERSION',
      version: APP_VERSION
    });
  }
});