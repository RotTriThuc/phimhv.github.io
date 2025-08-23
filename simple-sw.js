/* Simple Service Worker for PWA */

const CACHE_NAME = 'xemphim-simple-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/simple-manifest.json',
  '/assets/styles.css',
  '/assets/app.js',
  '/simple-pwa-install.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🔧 Simple SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Simple SW: Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('⚠️ Simple SW: Failed to cache some assets:', err);
        // Cache individually to avoid failures
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => cache.add(url))
        );
      });
    }).then(() => {
      console.log('✅ Simple SW: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - take control
self.addEventListener('activate', (event) => {
  console.log('🚀 Simple SW: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Simple SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Simple SW: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }
      
      // Fallback to network
      return fetch(event.request).catch((error) => {
        console.warn('🌐 Simple SW: Network request failed:', error);
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
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
                .container {
                  max-width: 400px;
                  margin: 0 auto;
                  padding: 40px;
                  border-radius: 12px;
                  background: #1a1b21;
                }
                h1 { color: #6c5ce7; }
                button {
                  background: #6c5ce7;
                  color: white;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📱 Bạn đang Offline</h1>
                <p>Không thể kết nối internet. Vui lòng thử lại sau.</p>
                <button onclick="location.reload()">Thử lại</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        return new Response('Network Error', { status: 503 });
      });
    })
  );
});

console.log('🎉 Simple Service Worker loaded and ready!'); 