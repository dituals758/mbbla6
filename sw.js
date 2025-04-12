const APP_VERSION = '1.1.8';
const CACHE_NAME = `kryakBudget-${APP_VERSION}`;
const RUNTIME_CACHE = 'runtime-cache';
const OFFLINE_URL = 'https://dituals758.github.io/mbbla6/offline.html';
const ASSETS = [
  'https://dituals758.github.io/mbbla6/',
  'https://dituals758.github.io/mbbla6/index.html',
  'https://dituals758.github.io/mbbla6/offline.html',
  'https://dituals758.github.io/mbbla6/styles.css',
  'https://dituals758.github.io/mbbla6/icons/icon-182x192.png',
  'https://dituals758.github.io/mbbla6/icons/icon-504x512.png',
  'https://dituals758.github.io/mbbla6/js/config.js',
  'https://dituals758.github.io/mbbla6/js/dom-elements.js',
  'https://dituals758.github.io/mbbla6/js/state.js',
  'https://dituals758.github.io/mbbla6/js/utils.js',
  'https://dituals758.github.io/mbbla6/js/service-worker.js',
  'https://dituals758.github.io/mbbla6/js/transactions.js',
  'https://dituals758.github.io/mbbla6/js/stats.js',
  'https://dituals758.github.io/mbbla6/js/ui.js',
  'https://dituals758.github.io/mbbla6/js/main.js'
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