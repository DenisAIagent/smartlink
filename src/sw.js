/**
 * SmartLink Service Worker
 * Advanced caching strategy for optimal performance
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `smartlink-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `smartlink-dynamic-${CACHE_VERSION}`;
const FIREBASE_CACHE = `smartlink-firebase-${CACHE_VERSION}`;
const IMAGES_CACHE = `smartlink-images-${CACHE_VERSION}`;
const ANALYTICS_CACHE = `smartlink-analytics-${CACHE_VERSION}`;

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGES_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache Firebase requests
registerRoute(
  ({ url }) => url.hostname.includes('firebaseapp.com') || 
              url.hostname.includes('googleapis.com') ||
              url.hostname.includes('firestore.googleapis.com'),
  new NetworkFirst({
    cacheName: FIREBASE_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache API requests with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  })
);

// Cache SmartLink pages for offline access
registerRoute(
  ({ url }) => url.pathname.startsWith('/s/'),
  new StaleWhileRevalidate({
    cacheName: 'smartlinks-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache CSS and JS files
registerRoute(
  ({ request }) => 
    request.destination === 'style' || 
    request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: STATIC_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Navigation route - serve app shell for all navigation requests
const navigationRoute = new NavigationRoute(({ event }) => {
  const url = new URL(event.request.url);
  
  // Don't cache auth pages or API routes
  if (url.pathname.startsWith('/api/') || 
      url.pathname.includes('auth') ||
      url.pathname.includes('login') ||
      url.pathname.includes('register')) {
    return false;
  }
  
  return true;
});

registerRoute(navigationRoute);

// Background sync for analytics
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  try {
    const cache = await caches.open(ANALYTICS_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.log('Sync failed for:', request.url);
      }
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// Handle offline analytics tracking
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/analytics') && 
      event.request.method === 'POST') {
    
    event.respondWith(
      fetch(event.request).catch(() => {
        // Store for background sync
        return caches.open(ANALYTICS_CACHE).then(cache => {
          cache.put(event.request, new Response());
          
          // Register for background sync
          self.registration.sync.register('analytics-sync');
          
          return new Response('Queued for sync', { status: 202 });
        });
      })
    );
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: data.url ? { url: data.url } : undefined,
      actions: [
        {
          action: 'view',
          title: 'Voir'
        },
        {
          action: 'dismiss',
          title: 'Ignorer'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    const url = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Install event - claim clients immediately
self.addEventListener('install', event => {
  console.log('SmartLink SW: Installing');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SmartLink SW: Activating');
  
  event.waitUntil(
    Promise.all([
      // Claim clients immediately
      clients.claim(),
      
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('smartlink-') && 
              !cacheName.includes(CACHE_VERSION)
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});

// Handle message events from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
    return;
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      buildDate: __BUILD_DATE__,
      appVersion: __APP_VERSION__
    });
    return;
  }
});

// Periodic background sync for cache cleanup
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupCaches());
  }
});

async function cleanupCaches() {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('smartlink-')) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        // Remove expired entries
        for (const request of requests) {
          const response = await cache.match(request);
          const date = response.headers.get('date');
          if (date) {
            const age = Date.now() - new Date(date).getTime();
            if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

console.log('SmartLink Service Worker loaded');