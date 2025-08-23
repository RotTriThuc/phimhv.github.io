/* Service Worker for XemPhim PWA */
/* Advanced caching strategy with offline support */

const CACHE_NAME = 'xemphim-v1.0.2';
const STATIC_CACHE = 'xemphim-static-v1.0.2';
const DYNAMIC_CACHE = 'xemphim-dynamic-v1.0.2';
const API_CACHE = 'xemphim-api-v1.0.2';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/styles.css',
  '/assets/polyfills.js',
  '/assets/es5-helpers.js',
  '/assets/app.js',
  '/assets/pwa-install.js',
  '/assets/image-fix-notification.js',
  '/movie-comments.css',
  '/firebase-config.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  'https://phimapi.com',
  'https://phimimg.com'
];

// CDN hosts to cache images from
const CDN_HOSTS = [
  'wsrv.nl',
  'images.weserv.nl',
  'i0.wp.com'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Service Worker: Caching static assets...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('✅ Service Worker: Static assets cached');
      // Force activation
      return self.skipWaiting();
    }).catch((error) => {
      console.error('❌ Service Worker: Failed to cache static assets', error);
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE &&
              cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activated and old caches cleaned');
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch Event - Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Handle different types of requests
  if (isStaticAsset(url)) {
    // Static assets: Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isAPIRequest(url)) {
    // API requests: Network First with offline fallback
    event.respondWith(networkFirstWithFallback(request, API_CACHE));
  } else if (isImageRequest(url)) {
    // Images: Cache First with CDN optimization - use no-cors for CDN images
    if (CDN_HOSTS.some(host => url.hostname.includes(host))) {
      const noCorsRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        mode: 'no-cors',
        credentials: 'omit',
        cache: 'default',
        redirect: 'follow'
      });
      event.respondWith(cacheFirstImage(noCorsRequest, DYNAMIC_CACHE));
    } else {
      event.respondWith(cacheFirstImage(request, DYNAMIC_CACHE));
    }
  } else if (isNavigationRequest(request)) {
    // Navigation: Network First, fallback to index.html
    event.respondWith(networkFirstNavigation(request));
  } else {
    // Other resources: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Cache First Strategy (for static assets)
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.clone) {
      try {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      } catch (cloneError) {
        console.warn('SW: Failed to cache static asset:', cloneError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Cache First failed:', error);
    return new Response('Asset not available offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Network First with fallback (for API requests)
async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.clone) {
      try {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      } catch (cloneError) {
        console.warn('SW: Failed to cache API response:', cloneError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Service Worker: Network failed, checking cache...');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for API
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Không có kết nối internet. Vui lòng thử lại sau.',
      data: []
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

// Cache First for images with CDN optimization
async function cacheFirstImage(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.clone) {
      try {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      } catch (cloneError) {
        console.warn('SW: Failed to cache image:', cloneError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder for failed images
    return new Response(createImagePlaceholder(), {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// Network First for navigation with offline fallback
async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - XemPhim</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: #0f0f12; 
            color: #e8e8ea; 
            text-align: center; 
            padding: 40px 20px; 
          }
          .offline-container {
            max-width: 400px;
            margin: 0 auto;
            padding: 40px;
            border-radius: 12px;
            background: #1a1b21;
            border: 1px solid #2a2c35;
          }
          .offline-icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #6c5ce7; margin-bottom: 16px; }
          p { color: #a0a0a8; line-height: 1.5; margin-bottom: 24px; }
          .retry-btn {
            background: linear-gradient(45deg, #6c5ce7, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .retry-btn:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📱</div>
          <h1>Bạn đang Offline</h1>
          <p>Không thể kết nối internet. Vui lòng kiểm tra kết nối và thử lại.</p>
          <button class="retry-btn" onclick="location.reload()">Thử lại</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok && networkResponse.clone) {
      try {
        const cache = caches.open(cacheName);
        cache.then(c => c.put(request, networkResponse.clone()));
      } catch (error) {
        console.warn('SW: Failed to cache response:', error);
      }
    }
    return networkResponse;
  }).catch(error => {
    console.warn('SW: Network request failed:', error);
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Helper Functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i) ||
         url.pathname === '/' ||
         url.pathname === '/index.html' ||
         url.pathname === '/manifest.json';
}

function isAPIRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.href.includes(endpoint));
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ||
         CDN_HOSTS.some(host => url.hostname.includes(host));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function createImagePlaceholder() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6c5ce7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="300" height="450" rx="8" fill="url(#grad)" opacity="0.1"/>
      <text x="150" y="200" text-anchor="middle" fill="#6c5ce7" font-size="48">🎬</text>
      <text x="150" y="250" text-anchor="middle" fill="#a0a0a8" font-size="16">Hình ảnh không khả dụng</text>
      <text x="150" y="280" text-anchor="middle" fill="#a0a0a8" font-size="12">Offline mode</text>
    </svg>
  `;
}

// Background Sync (for future features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('🔄 Service Worker: Performing background sync...');
}

// Push Notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      data: data.url,
      tag: 'xemphim-notification',
      renotify: true,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Xem ngay',
          icon: '/assets/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Đóng'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Log successful installation
console.log('🎉 Service Worker: Loaded and ready!');

// Periodic cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    !name.includes('v1.0.2') && name.includes('xemphim')
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log('🧹 Service Worker: Old caches cleaned up');
} 