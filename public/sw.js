// Offline support for the phone pages (/t, /t/CODE, /t/demo…), so a phone that
// loaded a workout can reload it with no network, mid-class.
//
// - Phone pages: network first, falling back to the last good copy.
// - Hashed build assets (/_next/static) and icons: cache first; they never change.
// - Everything else (coach area, auth, API): not touched.

const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
// Old builds' chunks pile up across deploys; keep the cache bounded.
const MAX_ASSETS = 200;
const PHONE_PAGE = /^\/(?:(?:en|ca)\/)?t(?:\/|$)/;
// Set by the "couldn't load" screen: an error page must never replace a good copy.
const NO_CACHE_MARKER = "data-no-offline-cache";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES, ASSETS]);
      for (const key of await caches.keys()) {
        if (!keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

const sameOrigin = (url) => url.origin === self.location.origin;
const isPhonePage = (url) => sameOrigin(url) && PHONE_PAGE.test(url.pathname);
const isStaticAsset = (url) =>
  sameOrigin(url) &&
  (url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/icon.svg");

/** Pages are stored by path: `?_rsc=` and other queries don't change the page. */
const pageKey = (url) => new URL(url.pathname, url.origin).href;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate" && isPhonePage(url)) {
    event.respondWith(networkFirst(event, url));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(event, url) {
  try {
    const response = await fetch(event.request);
    // Store a copy in the background, so the streamed page isn't delayed.
    event.waitUntil(storePage(url, response.clone()));
    return response;
  } catch (error) {
    const cached = await caches.match(pageKey(url), { cacheName: PAGES });
    if (cached) return cached;
    throw error;
  }
}

async function storePage(url, response) {
  if (!response.ok || response.redirected) return;
  try {
    const html = await response.clone().text();
    if (html.includes(NO_CACHE_MARKER)) return;
    const cache = await caches.open(PAGES);
    await cache.put(pageKey(url), response);
  } catch {
    // A page cut off mid-stream is simply not stored.
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    await trim(cache);
  }
  return response;
}

async function trim(cache) {
  const keys = await cache.keys();
  // Oldest entries first: Cache Storage keeps insertion order.
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) {
    await cache.delete(key);
  }
}

// The first visit happens before this worker controls the page, so the page
// tells it what to store: its own URL and the assets it already loaded.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "cache-page") return;
  event.waitUntil(
    (async () => {
      const assets = await caches.open(ASSETS);
      for (const href of data.assets ?? []) {
        const url = new URL(href, self.location.origin);
        if (!isStaticAsset(url) || (await assets.match(url.href))) continue;
        try {
          const response = await fetch(url.href);
          if (response.ok) await assets.put(url.href, response);
        } catch {
          // Best effort: a missing asset only matters if the phone goes offline.
        }
      }
      await trim(assets);

      const page = new URL(data.page, self.location.origin);
      if (!isPhonePage(page)) return;
      try {
        await storePage(page, await fetch(page.href));
      } catch {
        // Offline already: the next online visit stores it.
      }
    })(),
  );
});
