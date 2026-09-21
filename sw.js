// 离线缓存：首次打开后即可断网使用
const CACHE = 'beijiang-v336';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  const u = e.data && e.data.precache;
  if (!u) return;
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.allSettled(u.map(x => c.match(x).then(h => h || c.add(x))))
  ));
});
self.addEventListener('fetch', e => {
  // 记账/投票的云端请求都带 cache:"no-store"：不缓存也不兜底。以前断网时这里回了缓存的 index.html（200），
  // 页面当成「云端一条都没有」把本机账本清空；列表地址每次带时间戳，缓存还会无限涨。
  if (e.request.method !== 'GET' || e.request.cache === 'no-store') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
