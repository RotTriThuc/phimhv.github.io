/* Service Worker - Advanced offline support and caching strategies */

const CACHE_NAME = 'xemphim-v1.2.0';
const STATIC_CACHE = 'xemphim-static-v1.2.0';
const DYNAMIC_CACHE = 'xemphim-dynamic-v1.2.0';
const API_CACHE = 'xemphim-api-v1.2.0';
const IMAGE_CACHE = 'xemphim-images-v1.2.0';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache first (long-term caching)
  static: {
    pattern: /\.(js|css|html|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // API calls - Network first with fallback
  api: {
    pattern: /^https:\/\/phimapi\.com\//,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  
  // Images - Stale while revalidate
  images: {
    pattern: /\.(jpg|jpeg|png|gif|webp)$/,
    strategy: 'stale-while-revalidate',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  
  // Pages - Network first with offline fallback
  pages: {
    pattern: /^https?:\/\/[^\/]+\/(#\/.*)?$/,
    strategy: 'network-first',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 20
  }
};

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/styles.css',
  '/app-modular.js',
  '/modules/logger.js',
  '/modules/api.js',
  '/modules/utils.js',
  '/modules/ui-components.js',
  '/modules/router.js',
  '/modules/pages.js',
  '/modules/image-loader.js',
  '/modules/error-boundaries.js',
  '/modules/performance-monitor.js',
  '/modules/testing.js',
  '/firebase-config.js',
  '/manifest.json'
];

// Offline fallback pages
const OFFLINE_PAGES = {
  '/': '/offline.html',
  '/search': '/offline-search.html',
  '/saved': '/offline-saved.html'
};

// Install event - Precache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache offline pages
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('📄 Precaching offline pages');
        return cache.addAll(Object.values(OFFLINE_PAGES));
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch((error) => {
      console.error('❌ Service Worker installation failed:', error);
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
        
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    }).catch((error) => {
      console.error('❌ Service Worker activation failed:', error);
    })
  );
});

// Fetch event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Main request handler with intelligent caching
async function handleRequest(request) {
  const url = new URL(request.url);
  const strategy = getCacheStrategy(request);
  
  try {
    switch (strategy.strategy) {
      case 'cache-first':
        return await cacheFirst(request, strategy);
      case 'network-first':
        return await networkFirst(request, strategy);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request, strategy);
      default:
        return await networkFirst(request, strategy);
    }
  } catch (error) {
    console.error('❌ Request handling failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Determine cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (CACHE_STRATEGIES.api.pattern.test(url.href)) {
    return { ...CACHE_STRATEGIES.api, cacheName: API_CACHE };
  }
  
  // Image requests
  if (CACHE_STRATEGIES.images.pattern.test(url.pathname)) {
    return { ...CACHE_STRATEGIES.images, cacheName: IMAGE_CACHE };
  }
  
  // Static assets
  if (CACHE_STRATEGIES.static.pattern.test(url.pathname)) {
    return { ...CACHE_STRATEGIES.static, cacheName: STATIC_CACHE };
  }
  
  // Page requests
  if (CACHE_STRATEGIES.pages.pattern.test(url.href)) {
    return { ...CACHE_STRATEGIES.pages, cacheName: DYNAMIC_CACHE };
  }
  
  // Default to network first
  return { ...CACHE_STRATEGIES.pages, cacheName: DYNAMIC_CACHE };
}

// Cache first strategy - Good for static assets
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      console.log('📦 Serving stale cache due to network error');
      return cachedResponse;
    }
    throw error;
  }
}

// Network first strategy - Good for API calls and pages
async function networkFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(cache, strategy.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Serving cached response due to network error');
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy - Good for images
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(cache, strategy.maxEntries);
    }
    return networkResponse;
  }).catch((error) => {
    console.log('🌐 Background fetch failed:', error.message);
  });
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    // Don't await the network promise - let it update cache in background
    networkPromise;
    return cachedResponse;
  }
  
  // Wait for network if no cache or cache is expired
  try {
    return await networkPromise;
  } catch (error) {
    // Return stale cache as last resort
    if (cachedResponse) {
      console.log('📦 Serving stale cache as last resort');
      return cachedResponse;
    }
    throw error;
  }
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - responseTime) > maxAge;
}

// Clean up cache to maintain size limits
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (simple FIFO)
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    
    await Promise.all(
      entriesToDelete.map(key => cache.delete(key))
    );
    
    console.log(`🧹 Cleaned up ${entriesToDelete.length} cache entries`);
  }
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, serve offline page
  if (request.mode === 'navigate') {
    const offlinePage = OFFLINE_PAGES[url.pathname] || OFFLINE_PAGES['/'];
    const cache = await caches.open(DYNAMIC_CACHE);
    const offlineResponse = await cache.match(offlinePage);
    
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline HTML
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - XemPhim</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            .offline-title { font-size: 24px; margin-bottom: 10px; }
            .offline-message { color: #666; margin-bottom: 30px; }
            .retry-btn { 
              background: #007bff; color: white; border: none; 
              padding: 10px 20px; border-radius: 5px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-icon">📡</div>
          <div class="offline-title">Bạn đang offline</div>
          <div class="offline-message">Vui lòng kiểm tra kết nối mạng và thử lại</div>
          <button class="retry-btn" onclick="location.reload()">Thử lại</button>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // For other requests, return network error
  return new Response('Network error', {
    status: 408,
    statusText: 'Network error'
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-saved-movies') {
    event.waitUntil(syncSavedMovies());
  }
  
  if (event.tag === 'sync-watch-progress') {
    event.waitUntil(syncWatchProgress());
  }
});

// Sync saved movies when back online
async function syncSavedMovies() {
  try {
    console.log('🔄 Syncing saved movies...');
    
    // Get offline saved movies from IndexedDB
    const offlineMovies = await getOfflineSavedMovies();
    
    if (offlineMovies.length > 0) {
      // Sync with Firebase when online
      const response = await fetch('/api/sync-saved-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: offlineMovies })
      });
      
      if (response.ok) {
        console.log('✅ Saved movies synced successfully');
        await clearOfflineSavedMovies();
      }
    }
  } catch (error) {
    console.error('❌ Failed to sync saved movies:', error);
  }
}

// Sync watch progress when back online
async function syncWatchProgress() {
  try {
    console.log('🔄 Syncing watch progress...');
    
    // Get offline watch progress from IndexedDB
    const offlineProgress = await getOfflineWatchProgress();
    
    if (offlineProgress.length > 0) {
      // Sync with Firebase when online
      const response = await fetch('/api/sync-watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: offlineProgress })
      });
      
      if (response.ok) {
        console.log('✅ Watch progress synced successfully');
        await clearOfflineWatchProgress();
      }
    }
  } catch (error) {
    console.error('❌ Failed to sync watch progress:', error);
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getOfflineSavedMovies() {
  // Implementation would use IndexedDB to get offline saved movies
  return [];
}

async function clearOfflineSavedMovies() {
  // Implementation would clear offline saved movies from IndexedDB
}

async function getOfflineWatchProgress() {
  // Implementation would use IndexedDB to get offline watch progress
  return [];
}

async function clearOfflineWatchProgress() {
  // Implementation would clear offline watch progress from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: 'Có phim mới được cập nhật!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Xem ngay',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Đóng',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('XemPhim - Phim mới!', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open app to explore new movies
    event.waitUntil(
      clients.openWindow('/#/phim-moi')
    );
  }
});

console.log('🎬 XemPhim Service Worker loaded successfully');
