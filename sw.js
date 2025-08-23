const CACHE_NAME = 'phimhv-v1.0.0';
const STATIC_CACHE = 'phimhv-static-v1';
const DYNAMIC_CACHE = 'phimhv-dynamic-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/app.js',
  './assets/styles.css',
  './firebase-config.js',
  './manifest.json'
];

const CACHE_BLACKLIST = [
  'https://phimapi.com',
  'https://img.phimapi.com', 
  'https://apii.online'
];

// Install Event - Cache Static Assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.warn('[SW] Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip cross-origin requests and API calls
  if (!request.url.startsWith(self.location.origin) || 
      CACHE_BLACKLIST.some(url => request.url.includes(url))) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[SW] Serving from cache:', request.url);
          return response;
        }

        // Fetch from network and cache dynamic content
        return fetch(request)
          .then((fetchResponse) => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return fetchResponse;
          })
          .catch((error) => {
            console.warn('[SW] Fetch failed:', error);
            
            // Return offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Có phim mới cập nhật!',
    icon: '/phimhv.github.io/icons/icon-192x192.png',
    badge: '/phimhv.github.io/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Xem ngay',
        icon: '/phimhv.github.io/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Đóng',
        icon: '/phimhv.github.io/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('KKPhim - Xem Phim Online', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://rottriThuc.github.io/phimhv.github.io/')
    );
  }
});

// Helper function for background sync
async function doBackgroundSync() {
  try {
    // Sync any pending data when back online
    console.log('[SW] Performing background sync');
    // Add your sync logic here
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
} 