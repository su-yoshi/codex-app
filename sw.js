
const CACHE_NAME = 'kids-planner-cache-v63';
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './styles.css',
  './app.js',
  './workflow_code.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate' || (request.destination === 'document' && url.origin === location.origin)) {
    event.respondWith(handlePageRequest(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request));
    })
  );
});

async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    cache.put('./index.html', networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    const fallback = await caches.match('./index.html');
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

