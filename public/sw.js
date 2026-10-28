// Version comes from the registration URL (`sw.js?v=<build hash>`), injected by
// Vite's `__BUILD_VERSION__`. A new deploy changes the URL, so the browser
// installs a new worker, fills a new cache and the activate handler drops the
// previous one. Without this the old cache-first worker served stale builds
// forever.
const BUILD_VERSION = new URL(self.location.href).searchParams.get('v') || 'dev'
const CACHE_NAME = `river-raid-${BUILD_VERSION}`

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    ).then(() => self.clients.claim())
  )
})

function isCacheable(response) {
  return response && response.status === 200 && response.type === 'basic'
}

// Navigation is network-first: a deployed index.html must win over the cached
// copy, otherwise users keep booting the previous bundle until the new worker
// takes over on a later visit.
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const response = await fetch(request)
    if (isCacheable(response)) {
      cache.put(request, response.clone())
      cache.put('./index.html', response.clone())
    }
    return response
  } catch {
    return (await cache.match(request)) || (await cache.match('./index.html')) || Response.error()
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (isCacheable(response)) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request))
    return
  }

  event.respondWith(handleAsset(event.request))
})
