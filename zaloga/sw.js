const CACHE = 'gm-v5';
const ASSETS = ['/zaloga/', '/zaloga/index.html', '/zaloga/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});


// Minimal SW - no caching, always fetch fresh
//self.addEventListener('install', e => self.skipWaiting());
//self.addEventListener('activate', e => {
//  e.waitUntil(
//    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
//  );
//  self.clients.claim();
//});
//self.addEventListener('fetch', e => {
//  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
//});

