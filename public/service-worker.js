
const CACHE_NAME = 'senso-app-v3';
const API_CACHE_NAME = 'senso-api-v3';
const STATIC_CACHE_NAME = 'senso-static-v3';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/16X16.png',
  '/icons/32X32.png',
  '/icons/48X48.png',
  '/icons/144X144.png',
  '/icons/192X192.png',
  '/icons/512X512.png'
];

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  readings: 2 * 60 * 1000,      // 2 minutes - frequently changing
  analytics: 5 * 60 * 1000,      // 5 minutes - moderate updates
  rates: 24 * 60 * 60 * 1000,    // 24 hours - rarely changes
  forecast: 2 * 60 * 60 * 1000   // 2 hours - periodic updates
};

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Enhanced fetch handler with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Static assets - cache first
  if (request.destination === 'image' || request.destination === 'font' ||
      request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // HTML pages - network first
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Cache-first strategy (for static assets)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Cache-first fetch failed:', error);
    throw error;
  }
}

// Network-first strategy (for dynamic content)
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// API request handler with smart caching strategies
async function handleApiRequest(request, url) {
  const pathname = url.pathname;

  // Background sync for POST requests (meter readings, uploads)
  if (request.method === 'POST') {
    // Meter reading uploads - use background sync
    if (pathname.includes('/readings') || pathname.includes('/upload') || pathname.includes('/meter')) {
      return handleMeterReadingPost(request);
    }
  }

  // Critical data: Network-first (readings, anomalies)
  if (pathname.includes('/readings') || pathname.includes('/anomal')) {
    return networkFirstWithExpiration(request, API_CACHE_NAME, CACHE_EXPIRATION.readings);
  }

  // Analytics: Network-first with longer cache
  if (pathname.includes('/analytics') || pathname.includes('/usage')) {
    return networkFirstWithExpiration(request, API_CACHE_NAME, CACHE_EXPIRATION.analytics);
  }

  // Rates/Pricing: Cache-first (rarely changes)
  if (pathname.includes('/rates') || pathname.includes('/pricing')) {
    return cacheFirstWithExpiration(request, API_CACHE_NAME, CACHE_EXPIRATION.rates);
  }

  // Forecasts: Network-first with moderate cache
  if (pathname.includes('/forecast')) {
    return networkFirstWithExpiration(request, API_CACHE_NAME, CACHE_EXPIRATION.forecast);
  }

  // Default: Network-first for all other API requests
  return networkFirst(request, API_CACHE_NAME);
}

// Network-first with expiration check
async function networkFirstWithExpiration(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const clonedResponse = response.clone();

      // Add timestamp to cached response
      const cachedData = {
        response: clonedResponse,
        timestamp: Date.now()
      };

      cache.put(request, await addTimestampToResponse(response.clone(), Date.now()));
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      const timestamp = await getResponseTimestamp(cached);
      const age = Date.now() - timestamp;

      // Return cached if not expired
      if (age < maxAge) {
        console.log(`[SW] Serving cached API (age: ${Math.round(age/1000)}s):`, request.url);
        return cached;
      }
    }
    throw error;
  }
}

// Cache-first with expiration check
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cached = await caches.match(request);

  if (cached) {
    const timestamp = await getResponseTimestamp(cached);
    const age = Date.now() - timestamp;

    // Return cached if not expired
    if (age < maxAge) {
      console.log(`[SW] Serving cached API (age: ${Math.round(age/1000)}s):`, request.url);

      // Update in background if older than half maxAge
      if (age > maxAge / 2) {
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(cacheName).then(cache => {
              cache.put(request, addTimestampToResponse(response, Date.now()));
            });
          }
        }).catch(() => {});
      }

      return cached;
    }
  }

  // If no cache or expired, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, await addTimestampToResponse(response.clone(), Date.now()));
    }
    return response;
  } catch (error) {
    // Return stale cache as last resort
    if (cached) {
      console.log('[SW] Serving stale cache (network failed):', request.url);
      return cached;
    }
    throw error;
  }
}

// Add timestamp header to response
async function addTimestampToResponse(response, timestamp) {
  const blob = await response.blob();
  const headers = new Headers(response.headers);
  headers.set('X-SW-Cache-Time', timestamp.toString());

  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Get timestamp from cached response
async function getResponseTimestamp(response) {
  const timestamp = response.headers.get('X-SW-Cache-Time');
  return timestamp ? parseInt(timestamp, 10) : 0;
}

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated with enhanced caching');
      return self.clients.claim();
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    let notificationData;

    try {
      notificationData = event.data.json();
    } catch (e) {
      // Fallback to plain text
      notificationData = {
        title: 'Senso Utility Alert',
        body: event.data.text(),
        data: {}
      };
    }

    const options = {
      body: notificationData.body || notificationData.message,
      icon: notificationData.icon || '/icons/192X192.png',
      badge: '/icons/144X144.png',
      tag: notificationData.data?.notification_id || 'senso-notification',
      requireInteraction: notificationData.data?.severity === 'critical' || notificationData.data?.severity === 'high',
      data: notificationData.data || {},
      actions: getNotificationActions(notificationData.data?.type)
    };

    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || 'Senso Utility Alert',
        options
      ).then(() => {
        // Track notification delivery if notification_id is available
        if (notificationData.data?.notification_id) {
          trackNotificationDelivery(notificationData.data.notification_id);
        }
      })
    );
  }
});

// Get context-aware notification actions based on notification type
function getNotificationActions(notificationType) {
  const baseActions = [
    {
      action: 'dismiss',
      title: 'Dismiss'
    }
  ];

  switch (notificationType) {
    case 'anomaly_detected':
      return [
        {
          action: 'view_anomaly',
          title: 'View Details'
        },
        {
          action: 'view_suggestions',
          title: 'View Suggestions'
        },
        ...baseActions
      ];

    case 'reading_reminder':
      return [
        {
          action: 'take_reading',
          title: 'Take Reading'
        },
        {
          action: 'snooze',
          title: 'Remind Later'
        },
        ...baseActions
      ];

    case 'forecast_alert':
      return [
        {
          action: 'view_forecast',
          title: 'View Forecast'
        },
        ...baseActions
      ];

    default:
      return [
        {
          action: 'view',
          title: 'View Details'
        },
        ...baseActions
      ];
  }
}

// Track notification delivery
async function trackNotificationDelivery(notificationId) {
  try {
    await fetch('/api/v1/notifications/track-delivery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: notificationId,
        delivered_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.warn('Failed to track notification delivery:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  const notificationData = event.notification.data || {};

  event.notification.close();

  // Track notification click
  if (notificationData.notification_id) {
    trackNotificationClick(notificationData.notification_id, event.action);
  }

  const urlToOpen = getUrlForAction(event.action, notificationData);

  if (urlToOpen) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        // Check if there's already a window/tab open with the target URL
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Get URL to open based on notification action and data
function getUrlForAction(action, notificationData) {
  const baseUrl = self.location.origin;

  switch (action) {
    case 'view_anomaly':
      return notificationData.reading_id
        ? `${baseUrl}/water?anomaly=${notificationData.reading_id}`
        : `${baseUrl}/dashboard`;

    case 'view_suggestions':
      return notificationData.reading_id
        ? `${baseUrl}/water?anomaly=${notificationData.reading_id}&tab=suggestions`
        : `${baseUrl}/dashboard`;

    case 'take_reading':
      return notificationData.utility_type === 'electricity'
        ? `${baseUrl}/electricity`
        : `${baseUrl}/water`;

    case 'view_forecast':
      return `${baseUrl}/dashboard`;

    case 'snooze':
      // Handle snooze action (don't open a URL)
      scheduleSnoozeReminder(notificationData);
      return null;

    case 'view':
    default:
      return `${baseUrl}/dashboard`;
  }
}

// Track notification click
async function trackNotificationClick(notificationId, action) {
  try {
    await fetch('/api/v1/notifications/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: notificationId,
        action: action || 'default',
        clicked_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.warn('Failed to track notification click:', error);
  }
}

// Handle snooze functionality
function scheduleSnoozeReminder(notificationData) {
  // Schedule a new reminder in 1 hour
  const snoozeTime = 60 * 60 * 1000; // 1 hour in milliseconds

  setTimeout(() => {
    self.registration.showNotification('Reminder: Take Utility Reading', {
      body: 'You snoozed this reminder 1 hour ago.',
      icon: '/icons/192X192.png',
      badge: '/icons/144X144.png',
      tag: 'senso-snooze-reminder',
      requireInteraction: false,
      data: notificationData,
      actions: [
        {
          action: 'take_reading',
          title: 'Take Reading'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    });
  }, snoozeTime);
}

// Handle notification close
self.addEventListener('notificationclose', event => {
  const notificationData = event.notification.data || {};

  // Track notification dismissal
  if (notificationData.notification_id) {
    trackNotificationDismissal(notificationData.notification_id);
  }

  console.log('Notification was closed', event);
});

// Track notification dismissal
async function trackNotificationDismissal(notificationId) {
  try {
    await fetch('/api/v1/notifications/track-dismissal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: notificationId,
        dismissed_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.warn('Failed to track notification dismissal:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  const { type, utilityType, userId } = event.data || {};

  console.log('[Service Worker] Received message:', type);

  if (type === 'INVALIDATE_CACHE') {
    // Invalidate cache entries related to the utility type
    event.waitUntil(invalidateCacheByPattern(utilityType, userId));
  } else if (type === 'CLEAR_ALL_CACHES') {
    // Clear all caches except the current static cache
    event.waitUntil(clearAllApiCaches());
  }
});

// Invalidate cache entries matching utility type pattern
async function invalidateCacheByPattern(utilityType, userId) {
  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const url = request.url;

        // Check if URL contains utility type or user-specific data
        const shouldInvalidate =
          (utilityType === 'both' && (url.includes('/api/') && url.includes(userId))) ||
          (utilityType === 'water' && url.includes('water')) ||
          (utilityType === 'electricity' && url.includes('electricity')) ||
          url.includes('reading') ||
          url.includes('anomal') ||
          url.includes('forecast') ||
          url.includes('analytics');

        if (shouldInvalidate) {
          await cache.delete(request);
          console.log('[Service Worker] Invalidated cache:', url);
        }
      }
    }

    console.log('[Service Worker] Cache invalidation completed for:', utilityType);
  } catch (error) {
    console.error('[Service Worker] Cache invalidation failed:', error);
  }
}

// Clear all API caches while keeping static assets
async function clearAllApiCaches() {
  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      // Skip the current static cache
      if (cacheName === CACHE_NAME) {
        continue;
      }

      await caches.delete(cacheName);
      console.log('[Service Worker] Deleted cache:', cacheName);
    }

    // Also clear API responses from the main cache
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('/api/')) {
        await cache.delete(request);
      }
    }

    console.log('[Service Worker] All API caches cleared');
  } catch (error) {
    console.error('[Service Worker] Failed to clear all caches:', error);
  }
}

// ============================================
// Background Sync for Failed Operations
// ============================================

const SYNC_QUEUE_NAME = 'senso-sync-queue';

// Store failed requests in IndexedDB
async function storeFailedRequest(request, data) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_NAME);

    await store.add({
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: data,
      timestamp: Date.now()
    });

    console.log('[SW] Stored failed request for sync:', request.url);
  } catch (error) {
    console.error('[SW] Failed to store request:', error);
  }
}

// Open IndexedDB for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('senso-sync-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
        db.createObjectStore(SYNC_QUEUE_NAME, { keyPath: 'timestamp' });
      }
    };
  });
}

// Background sync event listener
self.addEventListener('sync', event => {
  console.log('[SW] Sync event triggered:', event.tag);

  if (event.tag === 'meter-reading-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

// Retry failed requests
async function syncFailedRequests() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_NAME);
    const requests = await store.getAll();

    console.log(`[SW] Found ${requests.length} failed requests to sync`);

    const results = await Promise.allSettled(
      requests.map(async (req) => {
        try {
          // Reconstruct request
          const headers = new Headers(req.headers);
          const response = await fetch(req.url, {
            method: req.method,
            headers: headers,
            body: req.body
          });

          if (response.ok) {
            // Delete from queue if successful
            await store.delete(req.timestamp);
            console.log('[SW] Successfully synced request:', req.url);

            // Notify client about successful sync
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                url: req.url,
                timestamp: req.timestamp
              });
            });

            return { success: true, req };
          } else {
            console.warn('[SW] Failed to sync (will retry):', req.url, response.status);
            return { success: false, req };
          }
        } catch (error) {
          console.error('[SW] Error syncing request:', req.url, error);
          return { success: false, req };
        }
      })
    );

    const successful = results.filter(r => r.value?.success).length;
    console.log(`[SW] Sync completed: ${successful}/${requests.length} successful`);

    return successful;
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Intercept POST requests for meter readings and queue if offline
async function handleMeterReadingPost(request) {
  try {
    // Clone request to read body
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();

    // Try to send immediately
    const response = await fetch(request);

    if (response.ok) {
      return response;
    } else {
      // Store for retry if server error
      await storeFailedRequest(request, body);

      // Register sync if supported
      if ('sync' in self.registration) {
        await self.registration.sync.register('meter-reading-sync');
      }

      return response;
    }
  } catch (error) {
    // Network error - store for sync
    console.log('[SW] Network error, queuing for sync:', request.url);

    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    await storeFailedRequest(request, body);

    // Register sync
    if ('sync' in self.registration) {
      try {
        await self.registration.sync.register('meter-reading-sync');
        console.log('[SW] Background sync registered');
      } catch (syncError) {
        console.error('[SW] Failed to register sync:', syncError);
      }
    }

    // Return a synthetic response
    return new Response(
      JSON.stringify({
        message: 'Request queued for sync when online',
        queued: true
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
