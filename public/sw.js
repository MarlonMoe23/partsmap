const CACHE_NAME = 'ifs-map-v1';
const STATIC_CACHE_NAME = 'ifs-map-static-v1';

const urlsToCache = [
  '/',
  '/manifest.json',
];

const staticResources = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
      caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(staticResources)),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== STATIC_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  if (request.destination === 'document') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request).then((res) => {
            if (res.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(request).then((res) => {
          if (res.status === 200) {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        }).catch(() => caches.match('/'));
      })
    );
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.status === 200) {
            caches.open(STATIC_CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
