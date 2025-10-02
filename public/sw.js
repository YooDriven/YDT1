const CACHE_NAME = 'drivetheory-pro-cache-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // We clone the response because it's a one-time use stream.
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      });

      // Return cached response immediately if available, and fetch in background.
      // Otherwise, wait for the network response.
      return cachedResponse || fetchPromise;
    })()
  );
});
