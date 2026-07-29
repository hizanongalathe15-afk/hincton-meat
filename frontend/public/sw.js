const CACHE = 'hincton-shell-v1'
const ASSETS = ['/', '/favicon_io/favicon-32x32.png', '/favicon_io/android-chrome-192x192.png']

self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))))
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && !event.request.url.includes('/api/')) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
    return response
  })))
})
