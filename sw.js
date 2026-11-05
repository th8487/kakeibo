// ひとこと家計簿：全部を端末に保存して即起動。更新したときは VERSION を上げる
const VERSION = "kakeibo-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== VERSION + "-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 保存済みの画面ですぐ開き、裏で最新版を取りに行く（次に開いたとき反映）
    const key = req.mode === "navigate" ? "./index.html" : req;
    e.respondWith(caches.open(VERSION).then(c => c.match(key).then(hit => {
      const net = fetch(req.url, {cache:"no-store"}).then(res => { if (res.ok) c.put(key, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSION + "-fonts").then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
