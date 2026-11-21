


const CACHE = "magazzino-smart-v28";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
].map(path => new URL(path, self.registration.scope).href);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("magazzino-smart-") &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (request.mode === "navigate") {
      try {
        return await fetch(request);
      } catch (error) {
        return await cache.match(
          new URL("./index.html", self.registration.scope).href
        ) || Response.error();
      }
    }

    const cached = await cache.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;

    } catch (error) {
      return new Response("Contenuto non disponibile offline.", {
        status: 503
      });
    }
  })());
});
