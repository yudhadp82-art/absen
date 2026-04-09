// ========================================
// Service Worker for PWA
// ========================================

const CACHE_NAME = 'absensi-v2.3.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/storage.js',
    '/js/location.js',
    '/js/api.js',
    '/js/app.js',
    '/manifest.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Files cached successfully');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Cache API only supports GET requests.
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    console.log('Service Worker: Serving from cache:', event.request.url);
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            console.log('Service Worker: Caching new resource:', event.request.url);
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(error => {
                    console.log('Service Worker: Fetch failed:', error);
                    // You can return a custom offline page here
                });
            })
    );
});

// Background sync (optional - for future use)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-attendance') {
        event.waitUntil(syncAttendance());
    }
});

// Push notifications (optional - for future use)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Notifikasi baru',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Absensi Karyawan', options)
    );
});
