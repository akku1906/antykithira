// Service worker: najpierw pamięć podręczna, w tle odświeżenie.
// Nowa wersja (nowy CACHE) instaluje się i czeka, aż użytkownik kliknie „Odśwież” na pasku
// „Jest nowa wersja” – wtedy strona wysyła {type: 'skipWaiting'} i przeładowuje się po zmianie kontrolera.
const CACHE = 'antykithira-v9';
const ASSETS = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg',
  'js/engine.js', 'js/draw.js', 'js/front.js', 'js/back.js', 'js/inside.js', 'js/app.js'];
self.addEventListener('install', (e) => {
  // cache: 'reload' omija pamięć HTTP przeglądarki, żeby nowa wersja nie zapisała starych plików
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'skipWaiting') self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // szukamy tylko we własnej pamięci, żeby czekająca wersja nie mieszała plików z bieżącą
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request)).then((hit) => {
    const net = fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
