// ================================================
// M@SA PLATFORM - SERVICE WORKER
// public/assets/sw.js
// Handles per-subject offline caching
// ================================================

const CACHE_VERSION = 'v1';
const CORE_CACHE    = `masa-core-${CACHE_VERSION}`;
const SUBJECT_CACHE_PREFIX = 'masa-subject-';

// Core assets always cached on install
const CORE_ASSETS = [
  '/',
  '/css/main.css',
  '/css/components.css',
  '/js/app.js',
  '/js/router.js',
  '/js/chatbot.js',
  '/js/quiz.js',
  '/assets/manifest.json',
  '/offline.html',
];

// ── INSTALL: cache core assets ────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('SW: Some core assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean old caches ────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('masa-core-') && k !== CORE_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: serve from cache if available ──────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't intercept API calls, YouTube, or POST requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('youtube') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('anthropic')
  ) {
    return;
  }

  // For uploaded files (PDFs, images, slides) - cache-first
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            // Find the right subject cache to store in
            const subjectId = getSubjectIdFromContext();
            const cacheName = subjectId
              ? `${SUBJECT_CACHE_PREFIX}${subjectId}`
              : CORE_CACHE;
            caches.open(cacheName).then(c => c.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => caches.match('/offline.html'));
      })
    );
    return;
  }

  // Network-first for HTML pages (always get fresh content when online)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(c => c || caches.match('/offline.html'))
      )
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, fonts)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CORE_CACHE).then(c => c.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});

// ── MESSAGE: handle subject download request ──────
self.addEventListener('message', async (event) => {
  if (event.data?.type === 'DOWNLOAD_SUBJECT') {
    const { subjectId, urls } = event.data;
    if (!subjectId || !urls?.length) return;

    const cacheName = `${SUBJECT_CACHE_PREFIX}${subjectId}`;
    const cache = await caches.open(cacheName);
    let cached = 0;

    for (const url of urls) {
      try {
        // Skip YouTube and external URLs
        if (url.includes('youtube') || url.includes('youtu.be')) continue;
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          cached++;
        }
      } catch (e) {
        // Skip failed items silently
      }
    }

    // Notify the page
    event.source?.postMessage({
      type: 'DOWNLOAD_COMPLETE',
      subjectId,
      cached,
      total: urls.length,
    });
  }

  if (event.data?.type === 'CHECK_SUBJECT_CACHED') {
    const { subjectId } = event.data;
    const cacheName = `${SUBJECT_CACHE_PREFIX}${subjectId}`;
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    event.source?.postMessage({
      type: 'SUBJECT_CACHE_STATUS',
      subjectId,
      isCached: keys.length > 0,
      fileCount: keys.length,
    });
  }

  if (event.data?.type === 'DELETE_SUBJECT_CACHE') {
    const { subjectId } = event.data;
    await caches.delete(`${SUBJECT_CACHE_PREFIX}${subjectId}`);
    event.source?.postMessage({ type: 'SUBJECT_CACHE_DELETED', subjectId });
  }
});

function getSubjectIdFromContext() {
  return self._currentSubjectId || null;
}
