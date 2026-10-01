// Service Worker para Avícola ERP - PWA Offline Support
const CACHE_NAME = "avicola-erp-v2.4";
const STATIC_CACHE = "avicola-static-v2.4";
const DYNAMIC_CACHE = "avicola-dynamic-v2.4";
const API_CACHE = "avicola-api-v2.4";

// Archivos estáticos a cachear
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/dashboard/production",
  "/dashboard/inventory",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  // Cache First - para assets estáticos
  static: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response("Offline", { status: 503 });
    }
  },

  // Network First - para API calls
  api: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: "Offline", offline: true }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // Stale While Revalidate - para páginas
  page: async (request) => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    }).catch(() => cached);

    return cached || fetchPromise;
  },
};

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith("avicola-") && name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension, etc.
  if (!url.protocol.startsWith("http")) return;

  // API calls - Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(CACHE_STRATEGIES.api(request));
    return;
  }

  // Static assets - Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(CACHE_STRATEGIES.static(request));
    return;
  }

  // Pages - Stale While Revalidate
  event.respondWith(CACHE_STRATEGIES.page(request));
});

// Background sync for offline submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-reports") {
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
  try {
    const cache = await caches.open("avicola-offline-reports");
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch {
        // Keep in cache for next sync
      }
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

// Push notifications (if needed)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/dashboard"));
});