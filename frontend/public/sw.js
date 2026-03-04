const CACHE_NAME = 'agenda-tracker-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
];

// 1. Install - Caching
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// 2. Activate - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Fetch - Offline support
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 4. Push - Background Notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Notification', message: event.data.text() };
    }

    const options = {
      body: data.body || data.message || 'You have a new update.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true, // Forces the pop-up to stay until acted upon
      data: {
        url: data.url || '/'
      },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Agenda Tracker', options)
    );
  }
});

// 5. Notification Click - Routing
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action !== 'close') {
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function (windowClients) {
          // Check if there is already a window/tab open with the same URL
          for (let i = 0; i < windowClients.length; i++) {
            let client = windowClients[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
