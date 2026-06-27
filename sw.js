/* ─── Vivenda Service Worker v7 — Network-First HTML + Auto-Reload ─── */
const CACHE = 'vivenda-v7';
const SHELL = ['/', '/index.html'];

/* Installa: metti in cache subito l'app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Attiva: cancella cache vecchie, prendi controllo, forza reload client */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => Promise.all(
        clients.map(client => client.navigate(client.url))
      ))
  );
});

/* Fetch:
   - HTML (/vivenda/, /vivenda/index.html) → NETWORK-FIRST (sempre aggiornato)
   - resto → CACHE-FIRST (veloce, aggiorna in background) */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHtml) {
    e.respondWith(
      fetch(e.request.clone())
        .then(resp => {
          if (resp && resp.ok) {
            caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request.clone())
            .then(resp => {
              if (resp && resp.ok) cache.put(e.request, resp.clone());
              return resp;
            })
            .catch(() => null);
          return cached || fetchPromise;
        })
      )
    );
  }
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
