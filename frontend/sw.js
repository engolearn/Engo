// sw.js - Service Worker للقاموس
const CACHE_NAME = 'engo-v1';
const OFFLINE_PAGE = '/offline.html';

// الملفات التي يتم تخزينها مؤقتاً
const urlsToCache = [
    '/',
    '/index.html',
    '/offline.html',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// تثبيت Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// التحقق من وجود إنترنت قبل تقديم الصفحة
self.addEventListener('fetch', function(event) {
    // نطلب من المتصفح محاولة الاتصال أولاً
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // إذا كان هناك إنترنت والطلب ناجح
                if (response && response.status === 200) {
                    // لا نخزن أي شيء في الكاش (نعمل اونلاين فقط)
                    return response;
                }
                return response;
            })
            .catch(function() {
                // إذا لم يوجد إنترنت، نقدم صفحة "لا يوجد اتصال"
                return caches.match(event.request)
                    .then(function(response) {
                        if (response) {
                            return response;
                        }
                        // إذا لم تكن الصفحة مخزنة، نقدم صفحة مخصصة
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_PAGE);
                        }
                        return null;
                    });
            })
    );
});

// تنظيف الكاش عند تفعيل الـ Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
