/**
 * 🔧 Service Worker for PhimHV
 * Caching strategy để tối ưu hiệu suất và offline experience
 */

const CACHE_NAME = 'phimhv-v1.0.0';
const STATIC_CACHE = 'phimhv-static-v1.0.0';
const DYNAMIC_CACHE = 'phimhv-dynamic-v1.0.0';
const IMAGE_CACHE = 'phimhv-images-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  './',
  './optimized-index.html',
  './utils/lazy-loader.js',
  './utils/data-pagination.js',
  './utils/virtual-scroller.js',
  './assets/styles.css',
  './manifest.json'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - Cache first
  static: [
    /\.js$/,
    /\.css$/,
    /\.html$/,
    /manifest\.json$/
  ],
  
  // Images - Cache first with fallback
  images: [
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.gif$/,
    /\.webp$/,
    /\.svg$/
  ],
  
  // API data - Network first with cache fallback
  api: [
    /\/data\//,
    /\.json$/
  ],
  
  // External resources - Stale while revalidate
  external: [
    /^https:\/\/img\.phimapi\.com/,
    /^https:\/\/phimapi\.com/,
    /^https:\/\/fonts\./,
    /^https:\/\/cdnjs\./
  ]
};

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event - Handle requests with appropriate strategy
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Handle request with appropriate caching strategy
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Static assets - Cache first
    if (matchesPattern(pathname, CACHE_STRATEGIES.static)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Images - Cache first with long TTL
    if (matchesPattern(pathname, CACHE_STRATEGIES.images) || 
        matchesPattern(url.href, CACHE_STRATEGIES.external)) {
      return await cacheFirst(request, IMAGE_CACHE, { maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
    }
    
    // API data - Network first
    if (matchesPattern(pathname, CACHE_STRATEGIES.api)) {
      return await networkFirst(request, DYNAMIC_CACHE, { timeout: 3000 });
    }
    
    // HTML pages - Network first with cache fallback
    if (pathname.endsWith('.html') || pathname === '/') {
      return await networkFirst(request, DYNAMIC_CACHE, { timeout: 2000 });
    }
    
    // Default - Network first
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('❌ Request failed:', request.url, error);
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return await getOfflineFallback();
    }
    
    // Return empty response for other requests
    return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cache is still fresh
    if (options.maxAge) {
      const cacheDate = new Date(cached.headers.get('date') || 0);
      const now = new Date();
      if (now - cacheDate > options.maxAge) {
        // Cache expired, fetch new version in background
        fetchAndCache(request, cacheName).catch(console.warn);
      }
    }
    
    console.log('📦 Cache hit:', request.url);
    return cached;
  }
  
  // Not in cache, fetch and cache
  console.log('🌐 Cache miss, fetching:', request.url);
  return await fetchAndCache(request, cacheName);
}

/**
 * Network first strategy
 */
async function networkFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network first
    const controller = new AbortController();
    const timeoutId = options.timeout ? 
      setTimeout(() => controller.abort(), options.timeout) : null;
    
    const response = await fetch(request, { 
      signal: controller.signal 
    });
    
    if (timeoutId) clearTimeout(timeoutId);
    
    if (response.ok) {
      // Cache successful response
      cache.put(request, response.clone()).catch(console.warn);
      console.log('🌐 Network success:', request.url);
      return response;
    }
    
    throw new Error(`HTTP ${response.status}`);
    
  } catch (error) {
    console.warn('⚠️ Network failed, trying cache:', request.url, error.message);
    
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('📦 Cache fallback:', request.url);
      return cached;
    }
    
    throw error;
  }
}

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone()).catch(console.warn);
  }
  
  return response;
}

/**
 * Get offline fallback page
 */
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE);
  const fallback = await cache.match('./optimized-index.html');
  
  if (fallback) {
    return fallback;
  }
  
  // Create minimal offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PhimHV - Offline</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #121212; 
          color: #fff; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0;
          text-align: center;
        }
        .offline-message {
          max-width: 400px;
          padding: 2rem;
        }
        .retry-btn {
          background: #6c5ce7;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <h1>📱 PhimHV</h1>
        <h2>🔌 Bạn đang offline</h2>
        <p>Không thể kết nối internet. Vui lòng kiểm tra kết nối và thử lại.</p>
        <button class="retry-btn" onclick="location.reload()">🔄 Thử lại</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Check if URL matches any pattern
 */
function matchesPattern(url, patterns) {
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Handle background sync
 */
async function doBackgroundSync() {
  // Retry failed requests stored in IndexedDB
  // Implementation depends on your specific needs
  console.log('🔄 Performing background sync...');
}

/**
 * Handle push notifications
 */
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: './icon-192.png',
    badge: './badge-72.png',
    tag: data.tag || 'default',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Periodic cache cleanup
 */
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Remove old entries (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cacheDate = new Date(response.headers.get('date') || 0);
        
        if (cacheDate.getTime() < thirtyDaysAgo) {
          await cache.delete(request);
          console.log('🧹 Cleaned old cache entry:', request.url);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily

console.log('🔧 Service Worker loaded successfully');
