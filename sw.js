self.addEventListener('install', e => {
  e.waitUntil(
      caches.open('finance').then(cache => {
          return cache.addAll(['https://dituals758.github.io/mbbla6/', 'https://dituals758.github.io/mbbla6/index.html']);
      })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
      caches.match(e.request).then(response => {
          return response || fetch(e.request);
      })
  );
});