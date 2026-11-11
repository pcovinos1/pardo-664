const CACHE_NAME = "pardo-664-v10";
const APP_SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "offline-cache-manifest.json"];
const scoped = (path) => new URL(path, self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const response = await fetch(scoped("offline-cache-manifest.json"), { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo preparar el contenido offline.");
    const manifest = await response.json();
    const files = [...new Set([...APP_SHELL, ...manifest.files])];
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(files.map(scoped));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => /^pardo-664-v\d+$/.test(key) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  const url = new URL(event.request.url);
  const content = url.pathname.endsWith("/content/project.json");
  if (content && url.searchParams.has("sync")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const navigation = event.request.mode === "navigate";
    const key = navigation ? scoped("index.html") : url.href;
    // The precache request and a module request can carry different Origin headers.
    const cached = () => cache.match(key, { ignoreVary: true });
    if (!navigation && !content) {
      const found = await cached();
      if (found) return found;
    }
    try {
      const response = await fetch(event.request);
      if (response.ok && response.status !== 206) await cache.put(key, response.clone()).catch(() => undefined);
      return response;
    } catch {
      return await cached() ?? Response.error();
    }
  })());
});
