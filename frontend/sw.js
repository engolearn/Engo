const CACHE_NAME = 'engo-v1';
const urlsToCache = ['/', '/index.html', '/chat.html', '/admin.html', '/manifest.json'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cache => cache !== CACHE_NAME && caches.delete(cache)))));
});

self.addEventListener('push', event => {
    const data = event.data.json();
    event.waitUntil(self.registration.showNotification(data.title, { body: data.message, icon: '/icons/icon-192x192.png', data: { url: data.link } }));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
