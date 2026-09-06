// VanGuard Service Worker — v2
// Network-first for the page (so updates reach users immediately), cache for assets.

const CACHE = 'vanguard-v5';
const SUPA_HOST = 'qzzwkxborlmmyaukvhga.supabase.co';

const SHELL = [
  '/',
  '/app',
  '/app/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-navy.png',
  '/success-confetti.json',
  'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.23.10/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
];

// Install — cache app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(SHELL.map(url => cache.add(url).catch(() => {})))
    )
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET Supabase calls — let the app's offline queue handle writes
  if (url.hostname === SUPA_HOST && request.method !== 'GET') return;

  // Supabase auth — always network only
  if (url.hostname === SUPA_HOST && url.pathname.startsWith('/auth/')) return;

  // Supabase REST reads — network first, fall back to cache
  if (url.hostname === SUPA_HOST) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // The HTML page itself — NETWORK FIRST so users always get the latest app after a
  // deploy. Falls back to the cached page only when offline.
  const isPageRequest = request.mode === 'navigate' ||
    (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html'));
  if (isPageRequest) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request).then(c => c || caches.match(url.pathname.startsWith('/app') ? '/app/' : '/')))
    );
    return;
  }

  // Static assets (icons, react, tailwind, etc.) — cache first, refresh in background.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'VanGuard';
  const options = {
    body: data.body || "Don't forget to log your compliance checks today",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'vanguard-reminder',
    renotify: false,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open / focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      return clients.openWindow(target);
    })
  );
});
