// Suprilo Service Worker (Web Push & Notification Management + Asset Cache)
// Spec Reference: SPEC-2C-5.7.5-REV7

const STATIC_CACHE_NAME = "suprilo-fixed-assets-v1";

const CORE_PRECACHE_URLS = [
  "/brand/logo.png",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
  "/brand/favicon.png",
  "/avatars/presets/preset-boy-1.svg",
  "/avatars/presets/preset-girl-1.svg",
  "/avatars/presets/preset-female-1.svg",
  "/avatars/presets/preset-male-1.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Precache non-blocking failure:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith("suprilo-fixed-assets-") && key !== STATIC_CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// Cache-First strategy for static platform assets (instant loading)
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Strictly check for same-origin static assets
  if (url.origin !== self.location.origin) return;

  const isFixedPlatformAsset =
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/images/badges/") ||
    url.pathname.startsWith("/avatars/presets/") ||
    url.pathname.startsWith("/landing/") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico");

  // Do not intercept API requests or Next.js build chunks
  if (!isFixedPlatformAsset || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        return cachedResponse || Promise.reject(err);
      }
    })
  );
});

const ALLOWED_EXACT_ROUTES = [
  "/profile",
  "/profile/badges",
  "/profile/notifications",
  "/profile/settings",
  "/profile/analytics",
  "/templates",
  "/create",
];

const ALLOWED_PARAM_PREFIXES = [
  "/c/", // Card reveal views: /c/:slug
  "/b/", // Badge showcase views: /b/:id
];

/**
 * Evaluates whether a pathname matches approved internal navigation destinations.
 */
function isSafeInternalPath(pathname) {
  if (ALLOWED_EXACT_ROUTES.includes(pathname)) {
    return true;
  }
  for (const prefix of ALLOWED_PARAM_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      const param = pathname.slice(prefix.length);
      // Strictly alphanumeric, hyphens, and underscores up to 64 chars
      if (/^[a-zA-Z0-9_-]{1,64}$/.test(param)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates and sanitizes destination URLs.
 * Strictly guarantees that only same-origin, safe internal routes can be opened.
 * Neutralizes external URLs, protocol-relative URLs, javascript: URIs, and unapproved routes.
 */
function sanitizeTargetUrl(rawUrl) {
  const origin = self.location.origin;

  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return `${origin}/profile`;
  }

  const trimmed = rawUrl.trim();

  // Reject protocol-relative URLs, data URIs, javascript URIs
  if (
    trimmed.startsWith("//") ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:")
  ) {
    return `${origin}/profile`;
  }

  try {
    const parsed = new URL(trimmed, origin);
    // Strict same-origin enforcement
    if (parsed.origin !== origin) {
      return `${origin}/profile`;
    }
    // Path allowlist enforcement
    if (isSafeInternalPath(parsed.pathname)) {
      return `${origin}${parsed.pathname}`;
    }
  } catch {
    // Malformed URL parse failure
  }

  return `${origin}/profile`;
}

/**
 * Handles incoming WebPush notifications.
 */
self.addEventListener("push", (event) => {
  let title = "Suprilo Notification";
  let body = "You have a new update in Suprilo.";
  let targetUrl = "/profile";
  let notificationId = "suprilo-notification";

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload && typeof payload === "object") {
        if (typeof payload.title === "string" && payload.title.trim()) {
          title = payload.title.trim().slice(0, 100);
        }
        if (typeof payload.body === "string" && payload.body.trim()) {
          body = payload.body.trim().slice(0, 250);
        }
        if (payload.data && typeof payload.data === "object") {
          if (typeof payload.data.url === "string") {
            targetUrl = payload.data.url;
          }
          if (typeof payload.data.notification_id === "string") {
            notificationId = payload.data.notification_id;
          }
        }
      }
    } catch {
      // In case payload was plain text
      const rawText = event.data.text();
      if (rawText) {
        body = rawText.slice(0, 250);
      }
    }
  }

  const safeUrl = sanitizeTargetUrl(targetUrl);

  const options = {
    body,
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    tag: notificationId,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: safeUrl,
      timestamp: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handles click interactions on displayed notifications.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = sanitizeTargetUrl(event.notification.data?.url);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a tab of this app is already open, focus and navigate it
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

