const CACHE = 'hincton-shell-v2'
const ASSETS = ['/', '/favicon_io/favicon-32x32.png', '/favicon_io/android-chrome-192x192.png']

const shouldHandle = (request) => {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (request.mode === 'navigate') return false
  return true
}

const putInCache = async (request, response) => {
  if (!response || !response.ok) return
  const clone = response.clone()
  const cache = await caches.open(CACHE)
  await cache.put(request, clone)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (!shouldHandle(event.request)) return

  event.respondWith((async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached

    try {
      const response = await fetch(event.request)
      if (response.ok) {
        event.waitUntil(putInCache(event.request, response))
      }
      return response
    } catch {
      if (event.request.destination === 'image') {
        return caches.match('/favicon_io/android-chrome-192x192.png')
      }
      return Response.error()
    }
  })())
})
