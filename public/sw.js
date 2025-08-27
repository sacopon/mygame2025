// 名前は適宜
const CACHE_NAME = 'retro-cache-v1';
const ASSETS = [
  '/',                // ルート
  '/index.html',
  '/textures/screen_bg.png',
  '/textures/virtualui.json',
  '/textures/virticalui.json',
  '/textures/horizontalui.json',
  // 必要な png, jpg, woff, js, css を列挙
  // Viteの出力名が変わるなら #vite-plugin-pwa 推奨
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 基本: ネット優先、失敗したらキャッシュ
self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    fetch(req).then(res => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, resClone));
      return res;
    }).catch(() => caches.match(req).then(m => m || caches.match('/')))
  );
});
