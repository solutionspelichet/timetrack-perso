self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open('timetrack-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/script.js',
        '/style.css',
        '/icon-192.png',
        '/icon-512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
