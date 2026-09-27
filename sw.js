// Service worker: keeps a copy of the app so it also opens without internet.
// Strategy "stale-while-revalidate": answer from the cache immediately and
// refresh the cache in the background, so updates arrive on the next visit.
const CACHE = "kassensturz-v2";
const ASSETS = [
  "./", "index.html", "style.css", "app.js", "calc.js", "storage.js", "manifest.webmanifest",
  "assets/favicon.ico", "assets/icon-192.png", "assets/icon-512.png", "assets/apple-touch-icon.png",
  ...["coin_1_cent", "coin_2_cent", "coin_5_cent", "coin_10_cent", "coin_20_cent", "coin_50_cent",
    "coin_1_euro", "coin_2_euro", "note_5_euro", "note_10_euro", "note_20_euro", "note_50_euro",
    "note_100_euro", "note_200_euro", "note_500_euro"].map((n) => `assets/${n}.webp`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.includes("/downloads/")) return; // never cache the 14 MB installer
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
