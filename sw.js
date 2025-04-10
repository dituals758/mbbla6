const CACHE_NAME = 'finance-v9.1';
const ASSETS = [
  '/mbbla6/',
  '/mbbla6/index.html',
  '/mbbla6/styles.css',
  '/mbbla6/app.js',
  '/mbbla6/manifest.json',
  '/mbbla6/icon-512.png',
  '/mbbla6/icon-192.png',
  '/mbbla6/icon-iphone.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(err => console.error('Ошибка кэширования:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => 
        key !== CACHE_NAME ? caches.delete(key) : null
      ))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Не кэшировать API Google
  if (url.origin === 'https://script.google.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetchAndCache(event.request))
  );
});

async function fetchAndCache(request) {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(request);
  await cache.put(request, response.clone());
  return response;
}