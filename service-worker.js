/* Service Worker - Advanced offline support and caching strategies */

// Enhanced Production logging system for Service Worker - Hide debug info but keep errors
const isDev =
  self.location.hostname === 'localhost' ||
  self.location.hostname.includes('127.0.0.1');
const hideDebugInfo = true; // Hide sensitive debug info in production

const SWLogger = {
  // Hide debug/info logs that might contain sensitive data
  debug:
    isDev && !hideDebugInfo
      ? (...args) => console.log('🔧 [SW-DEBUG]', ...args)
      : () => {},
  info:
    isDev && !hideDebugInfo
      ? (...args) => console.log('ℹ️ [SW-INFO]', ...args)
      : () => {},

  // Always show warnings and errors for debugging issues
  warn: (...args) => console.warn('⚠️ [SW-WARN]', ...args),
  error: (...args) => console.error('❌ [SW-ERROR]', ...args),
  critical: (...args) => console.error('🚨 [SW-CRITICAL]', ...args)
};

const CACHE_NAME = 'xemphim-v1.3.0';
const STATIC_CACHE = 'xemphim-static-v1.3.0';
const DYNAMIC_CACHE = 'xemphim-dynamic-v1.3.0';
const API_CACHE = 'xemphim-api-v1.3.0';
const IMAGE_CACHE = 'xemphim-images-v1.3.0';
const VIDEO_CACHE = 'xemphim-video-v1.3.0';
const VIDEO_SEGMENT_CACHE = 'xemphim-video-segments-v1.3.0';

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
  },

  // Video streams - Special handling for HLS and video files
  video: {
    pattern: /\.(m3u8|ts|mp4|webm|mkv)$/,
    strategy: 'video-cache-first',
    maxAge: 2 * 60 * 60 * 1000, // 2 hours for video segments
    maxEntries: 100,
    supportRangeRequests: true
  },

  // Video manifests - Network first with short cache
  videoManifest: {
    pattern: /\.m3u8$/,
    strategy: 'network-first',
    maxAge: 30 * 1000, // 30 seconds
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
  '/modules/network-monitor.js',
  '/modules/video-player.js',
  '/modules/video-cache.js',
  '/firebase-config.js',
  '/manifest.json',
  '/assets/images/no-poster.svg'
];

// Offline fallback pages
const OFFLINE_PAGES = {
  '/': '/offline.html',
  '/search': '/offline-search.html',
  '/saved': '/offline-saved.html'
};

// Install event - Precache static assets
self.addEventListener('install', (event) => {
  SWLogger.info('Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        SWLogger.debug('Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache offline pages
      caches.open(DYNAMIC_CACHE).then((cache) => {
        SWLogger.debug('Precaching offline pages');
        return cache.addAll(Object.values(OFFLINE_PAGES));
      })
    ])
      .then(() => {
        SWLogger.info('Service Worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        SWLogger.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  SWLogger.info('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const validCaches = [
          STATIC_CACHE,
          DYNAMIC_CACHE,
          API_CACHE,
          IMAGE_CACHE,
          VIDEO_CACHE,
          VIDEO_SEGMENT_CACHE
        ];

        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              SWLogger.debug('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Claim all clients
      self.clients.claim()
    ])
      .then(() => {
        SWLogger.info('Service Worker activated successfully');
      })
      .catch((error) => {
        SWLogger.error('Service Worker activation failed:', error);
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
    case 'video-cache-first':
      return await videoCacheFirst(request, strategy);
    default:
      return await networkFirst(request, strategy);
    }
  } catch (error) {
    SWLogger.error('Request handling failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Determine cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Video manifest requests (.m3u8)
  if (CACHE_STRATEGIES.videoManifest.pattern.test(url.pathname)) {
    return { ...CACHE_STRATEGIES.videoManifest, cacheName: VIDEO_CACHE };
  }

  // Video segment requests (.ts, .mp4, etc.)
  if (CACHE_STRATEGIES.video.pattern.test(url.pathname)) {
    return { ...CACHE_STRATEGIES.video, cacheName: VIDEO_SEGMENT_CACHE };
  }

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
      SWLogger.debug('Serving stale cache due to network error');
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
      SWLogger.debug('Serving cached response due to network error');
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
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        await cleanupCache(cache, strategy.maxEntries);
      }
      return networkResponse;
    })
    .catch((error) => {
      SWLogger.debug('Background fetch failed:', error.message);
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
      SWLogger.debug('Serving stale cache as last resort');
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

  return now - responseTime > maxAge;
}

// Video cache first strategy with range request support
async function videoCacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const url = new URL(request.url);

  // Handle range requests for video segments
  if (request.headers.get('range')) {
    return await handleRangeRequest(request, cache, strategy);
  }

  // Regular video request handling
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    SWLogger.debug('Video cache hit:', url.pathname);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone response before caching
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(cache, strategy.maxEntries);

      SWLogger.debug('Video cached:', url.pathname);
    }

    return networkResponse;
  } catch (error) {
    // Return stale cache if network fails
    if (cachedResponse) {
      SWLogger.debug('Serving stale video cache due to network error');
      return cachedResponse;
    }
    throw error;
  }
}

// Handle range requests for video streaming
async function handleRangeRequest(request, cache, strategy) {
  const url = new URL(request.url);
  const rangeHeader = request.headers.get('range');

  SWLogger.debug('Handling range request:', rangeHeader, 'for:', url.pathname);

  // Try to get full cached response first
  const cachedResponse = await cache.match(request.url);

  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    // Extract range from cached response
    const responseBuffer = await cachedResponse.arrayBuffer();
    return createRangeResponse(
      responseBuffer,
      rangeHeader,
      cachedResponse.headers
    );
  }

  // Fetch from network with range request
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // For partial content, cache the full resource if possible
      if (networkResponse.status === 206) {
        // Try to fetch full resource for caching (without range header)
        const fullRequest = new Request(request.url, {
          method: 'GET',
          headers: new Headers(request.headers)
        });
        fullRequest.headers.delete('range');

        // Fetch full resource in background for caching
        fetch(fullRequest)
          .then(async (fullResponse) => {
            if (fullResponse.ok && fullResponse.status === 200) {
              const responseClone = fullResponse.clone();
              await cache.put(fullRequest, responseClone);
              await cleanupCache(cache, strategy.maxEntries);
              SWLogger.debug(
                'Full video cached for future range requests:',
                url.pathname
              );
            }
          })
          .catch(() => {
            // Silent fail for background caching
          });
      }
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cached response if available
    if (cachedResponse) {
      const responseBuffer = await cachedResponse.arrayBuffer();
      return createRangeResponse(
        responseBuffer,
        rangeHeader,
        cachedResponse.headers
      );
    }
    throw error;
  }
}

// Create range response from cached buffer
function createRangeResponse(buffer, rangeHeader, originalHeaders) {
  const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!rangeMatch) {
    return new Response(buffer, { status: 200, headers: originalHeaders });
  }

  const start = parseInt(rangeMatch[1]);
  const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : buffer.byteLength - 1;
  const slicedBuffer = buffer.slice(start, end + 1);

  const headers = new Headers(originalHeaders);
  headers.set('Content-Range', `bytes ${start}-${end}/${buffer.byteLength}`);
  headers.set('Content-Length', slicedBuffer.byteLength.toString());
  headers.set('Accept-Ranges', 'bytes');

  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: headers
  });
}

// Clean up cache to maintain size limits
async function cleanupCache(cache, maxEntries) {
  if (!maxEntries) return;

  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries (simple FIFO)
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);

    await Promise.all(entriesToDelete.map((key) => cache.delete(key)));

    SWLogger.debug(`Cleaned up ${entriesToDelete.length} cache entries`);
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
    return new Response(
      `
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
    `,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  // For other requests, return network error
  return new Response('Network error', {
    status: 408,
    statusText: 'Network error'
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  SWLogger.debug('Background sync triggered:', event.tag);

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
    SWLogger.debug('Syncing saved movies...');

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
        SWLogger.info('Saved movies synced successfully');
        await clearOfflineSavedMovies();
      }
    }
  } catch (error) {
    SWLogger.error('Failed to sync saved movies:', error);
  }
}

// Sync watch progress when back online
async function syncWatchProgress() {
  try {
    SWLogger.debug('Syncing watch progress...');

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
        SWLogger.info('Watch progress synced successfully');
        await clearOfflineWatchProgress();
      }
    }
  } catch (error) {
    SWLogger.error('Failed to sync watch progress:', error);
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
  SWLogger.debug('Push notification received');

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
  SWLogger.debug('Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'explore') {
    // Open app to explore new movies
    event.waitUntil(clients.openWindow('/#/phim-moi'));
  }
});

// Hard Refresh Message Handling
self.addEventListener('message', (event) => {
  SWLogger.debug('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'HARD_REFRESH_REQUEST') {
    event.waitUntil(handleHardRefreshRequest(event));
  }
});

// Handle hard refresh request từ main thread
async function handleHardRefreshRequest(event) {
  const startTime = Date.now();

  try {
    SWLogger.info('🔄 Processing hard refresh request...');

    // Clear tất cả cache stores
    const cacheNames = await caches.keys();
    const clearPromises = cacheNames.map(async (cacheName) => {
      try {
        const deleted = await caches.delete(cacheName);
        if (deleted) {
          SWLogger.debug(`✅ Cleared cache: ${cacheName}`);
        } else {
          SWLogger.warn(`⚠️ Failed to clear cache: ${cacheName}`);
        }
        return deleted;
      } catch (error) {
        SWLogger.error(`❌ Error clearing cache ${cacheName}:`, error);
        return false;
      }
    });

    const results = await Promise.all(clearPromises);
    const successCount = results.filter(Boolean).length;
    const totalCount = cacheNames.length;

    const duration = Date.now() - startTime;

    // Send response back to main thread
    const response = {
      type: 'HARD_REFRESH_RESPONSE',
      success: true,
      clearedCaches: successCount,
      totalCaches: totalCount,
      duration: duration,
      timestamp: Date.now()
    };

    // Send to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(response);
    });

    SWLogger.info(`✅ Hard refresh completed: ${successCount}/${totalCount} caches cleared in ${duration}ms`);

  } catch (error) {
    SWLogger.error('❌ Hard refresh failed:', error);

    // Send error response
    const errorResponse = {
      type: 'HARD_REFRESH_RESPONSE',
      success: false,
      error: error.message,
      timestamp: Date.now()
    };

    // Send to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(errorResponse);
    });
  }
}

// Enhanced cache clearing function cho hard refresh
async function clearAllCachesForHardRefresh() {
  try {
    SWLogger.info('🗑️ Starting comprehensive cache clearing...');

    const cacheNames = await caches.keys();
    const results = {
      total: cacheNames.length,
      cleared: 0,
      failed: 0,
      details: []
    };

    // Clear each cache individually với detailed logging
    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const keyCount = keys.length;

        const deleted = await caches.delete(cacheName);

        if (deleted) {
          results.cleared++;
          results.details.push({
            name: cacheName,
            status: 'cleared',
            entries: keyCount
          });
          SWLogger.debug(`✅ Cleared cache "${cacheName}" (${keyCount} entries)`);
        } else {
          results.failed++;
          results.details.push({
            name: cacheName,
            status: 'failed',
            entries: keyCount
          });
          SWLogger.warn(`⚠️ Failed to clear cache "${cacheName}"`);
        }

      } catch (error) {
        results.failed++;
        results.details.push({
          name: cacheName,
          status: 'error',
          error: error.message
        });
        SWLogger.error(`❌ Error clearing cache "${cacheName}":`, error);
      }
    }

    SWLogger.info(`🎯 Cache clearing summary: ${results.cleared}/${results.total} cleared, ${results.failed} failed`);
    return results;

  } catch (error) {
    SWLogger.error('❌ Failed to clear caches:', error);
    throw error;
  }
}

SWLogger.info('XemPhim Service Worker loaded successfully (with Hard Refresh support)');
