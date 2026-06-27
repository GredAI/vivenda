/* ─── Vivenda Service Worker v5 — Cache-First ─── */
const CACHE = 'vivenda-v5';
const SHELL = ['/', '/index.html'];

/* Installa: metti in cache subito l'app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Attiva: cancella cache vecchie, prendi controllo */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Fetch: CACHE-FIRST — risponde subito dalla cache,
   aggiorna in background (stale-while-revalidate) */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        /* Aggiorna in background senza bloccare */
        const fetchPromise = fetch(e.request.clone())
          .then(resp => {
            if (resp && resp.ok) cache.put(e.request, resp.clone());
            return resp;
          })
          .catch(() => null);

        /* Serve subito dalla cache se disponibile */
        return cached || fetchPromise;
      })
    )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
