const CACHE = 'hincton-shell-v3'
const ASSETS = [
  '/',
  '/favicon_io/favicon-32x32.png',
  '/favicon_io/favicon-16x16.png',
  '/favicon_io/android-chrome-192x192.png',
  '/favicon_io/site.webmanifest'
]

const shouldHandle = (request) => {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/features/')) return false
  return true
}

const putInCache = async (request, response) => {
  if (!response || !response.ok || response.status !== 200 || response.type === 'opaque') return
  try {
    const clone = response.clone()
    const cache = await caches.open(CACHE)
    await cache.put(request, clone)
  } catch {
    // Ignore cache storage errors
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
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
    try {
      // Stale-while-revalidate for static assets, network-first for navigation
      const cached = await caches.match(event.request)
      if (cached && event.request.mode !== 'navigate') {
        fetch(event.request).then((resp) => {
          if (resp && resp.ok) putInCache(event.request, resp)
        }).catch(() => {})
        return cached
      }

      const response = await fetch(event.request)
      if (response && response.ok) {
        event.waitUntil(putInCache(event.request, response))
      }
      return response
    } catch {
      const cachedFallback = await caches.match(event.request)
      if (cachedFallback) return cachedFallback

      if (event.request.mode === 'navigate') {
        const rootMatch = await caches.match('/')
        if (rootMatch) return rootMatch
      }

      if (event.request.destination === 'image') {
        const iconMatch = await caches.match('/favicon_io/android-chrome-192x192.png')
        if (iconMatch) return iconMatch
      }

      return new Response('', { status: 200, statusText: 'Offline' })
    }
  })())
})
