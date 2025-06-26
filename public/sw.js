const CACHE_NAME = 'skillzone-v2';
const STATIC_CACHE = 'skillzone-static-v2';
const DYNAMIC_CACHE = 'skillzone-dynamic-v2';

// Resources to cache for offline functionality
const staticAssets = [
  '/',
  '/manifest.json',
  '/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(staticAssets);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  } else {
    // For non-GET requests, try network first, then show offline message
    event.respondWith(handleNonGetRequest(request));
  }
});

async function handleGetRequest(request) {
  const url = new URL(request.url);

  try {
    // For navigation requests, try cache first, then network
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/');
      if (cachedResponse) {
        // Try to fetch fresh content in background
        fetch(request.url).then(response => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request.url, response.clone());
            });
          }
        }).catch(() => {
          // Network failed, but we have cached content
        });
        return cachedResponse;
      }
    }

    // For static assets, check cache first
    if (staticAssets.includes(url.pathname)) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Try network first for API calls and dynamic content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;

  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request and we have no cache, return the main app
    if (request.mode === 'navigate') {
      const appShell = await caches.match('/');
      if (appShell) {
        return appShell;
      }
    }

    // Return a basic offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

async function handleNonGetRequest(request) {
  try {
    // Try network first for mutations
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Network failed for mutation - return error response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This action requires an internet connection and will be retried when online'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'skillzone-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    // Notify the main app that sync is starting
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_START'
      });
    });

    // The actual sync logic will be handled by the app's sync store
    console.log('Service Worker: Background sync completed');
    
    // Notify success
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SUCCESS'
      });
    });
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        error: error.message
      });
    });
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: 'You have a new message in SkillZone',
    icon: '/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png',
    badge: '/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/lovable-uploads/66e50579-9d23-4c55-a7d5-b7ecbf89cccd.png'
      }
    ],
    tag: 'skillzone-notification',
    renotify: true,
    requireInteraction: false
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.title = payload.title || 'SkillZone';
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.error('Service Worker: Failed to parse push payload', error);
      options.title = 'SkillZone';
    }
  } else {
    options.title = 'SkillZone';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'skillzone-periodic-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

console.log('Service Worker: Script loaded');
