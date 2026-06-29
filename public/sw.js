// 完全オフライン優先 Service Worker。
// Macを閉じていても起動できるよう、すべてキャッシュ優先（裏でネットワーク更新）。
const CACHE = 'pokechan-v18';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './data/base/pokemon.json',
  './data/base/moves.json',
  './data/base/abilities.json',
  './data/base/typeChart.json',
  './data/champions/overrides.json',
  './data/champions/newMegas.json',
  './data/champions/newItems.json',
  './data/regulations/m-b.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(CORE.map((url) => cache.add(url))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // すべてキャッシュ優先（オフラインでも即起動）。裏でネットワーク更新を試み、次回反映。
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          // 正常レスポンスのみ更新
          if (res && res.status === 200 && res.type !== 'opaque') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
      return cached || fetched;
    }),
  );
});
