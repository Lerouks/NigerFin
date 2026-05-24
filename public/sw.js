// Service worker minimal pour le NFI Cockpit (PWA admin).
// Strategy :
//  - NetworkFirst pour les routes /admin/* et /api/admin/* : data toujours fraiche, fallback cache si offline
//  - CacheFirst pour les assets statiques (/icons/, /_next/static/) : performance + offline shell
//  - Pas d'interception du site public (le PWA scope est limite a /admin)
//
// Perf M-4 : version cache aligne sur la version package.json (bump manuel a
// chaque release notable). Pour une invalidation automatique parfaite, viser
// a terme un build-step qui remplace CACHE_VERSION par VERCEL_DEPLOYMENT_ID
// (voir TODOS-SECURITY.md - non bloquant pour le launch).
const CACHE_VERSION = 'nfi-cockpit-v2-2026-05';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => null)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname === '/manifest.webmanifest'
  );
}

function isAdminScope(url) {
  return url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone)).catch(() => null);
          }
          return response;
        });
      }),
    );
    return;
  }

  if (isAdminScope(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.headers.get('accept')?.includes('text/html')) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone)).catch(() => null);
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error())),
    );
  }
});

// Web Push : reception et affichage d'une notification.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'NFI Cockpit', body: event.data.text() };
  }
  const title = payload.title || 'NFI Cockpit';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || 'nfi-cockpit',
    data: { url: payload.url || '/admin' },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Defense in depth : on n'ouvre que des chemins relatifs same-origin commencant
  // par /. Empeche un futur push compromis d'envoyer un targetUrl externe et de
  // forcer openWindow vers un site malveillant.
  const raw = event.notification.data && event.notification.data.url;
  const targetUrl = typeof raw === 'string' && raw.startsWith('/') ? raw : '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
