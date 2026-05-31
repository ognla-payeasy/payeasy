/* eslint-disable no-restricted-globals */

/**
 * PayEasy service worker.
 *
 * Responsibilities:
 *   1. Cache the landing page, manifest, icons, and the offline fallback so the
 *      app renders something useful when the network is unavailable.
 *   2. Serve cached responses for navigations and static assets when offline,
 *      falling back to /offline.html for navigations we have never cached.
 *   3. Broadcast `update-available` to clients when a new worker takes over so
 *      the UI can offer a refresh.
 *   4. Preserve the existing web-push behavior (notifications + click-to-open).
 *
 * Soroban / Horizon / authenticated API calls are explicitly NOT cached —
 * blockchain reads must reflect real-time state.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `payeasy-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `payeasy-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept") &&
      request.headers.get("accept").includes("text/html"))
  );
}

function isCacheableStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  // Next.js static build output, fonts, public/ assets.
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|ico)$/i.test(
      url.pathname
    )
  );
}

function shouldBypassCache(url) {
  if (url.origin !== self.location.origin) return true;
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/_next/image")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // `addAll` is atomic — if any asset 404s the whole install fails. Use
      // `add` per-entry instead so a missing icon does not break offline.
      await Promise.all(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch(() => {
            // Asset unavailable at install time; runtime fetch may still cache it.
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("payeasy-") &&
              key !== STATIC_CACHE &&
              key !== RUNTIME_CACHE
          )
          .map((key) => caches.delete(key))
      );

      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          // Navigation preload is optional; ignore if unsupported.
        }
      }

      await self.clients.claim();

      // Tell open clients a new SW is now controlling them so the UI can
      // surface an "Update available" banner.
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({ type: "payeasy:update-available" });
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "payeasy:skip-waiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (shouldBypassCache(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (isCacheableStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  }
});

async function handleNavigation(event) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const preload = event.preloadResponse
      ? await event.preloadResponse
      : null;
    const networkResponse = preload || (await fetch(event.request));

    if (networkResponse && networkResponse.ok) {
      cache.put(event.request, networkResponse.clone()).catch(() => undefined);
    }
    return networkResponse;
  } catch {
    const cached =
      (await cache.match(event.request)) ||
      (await caches.match(event.request)) ||
      (await caches.match("/"));
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => undefined);
    }
    return networkResponse;
  } catch {
    // Re-check the cache in case it was filled concurrently, then surface a
    // structured 503 so the page can decide what to render.
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// ─── Push notifications (existing behavior, preserved) ──────────────────────

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "PayEasy reminder";
  const options = {
    body: payload.body || "Your rent deadline is approaching.",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    data: {
      url: payload.url || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(clients.openWindow(targetUrl));
});
