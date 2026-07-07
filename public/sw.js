/* ไปเล่า — Service Worker (PWA)
 * หลักการ: อนุรักษ์นิยมสุด ๆ ไม่ให้กระทบเว็บที่ออนอยู่
 *  - ไม่แตะ /api/ ทุกกรณี · ไม่แตะ request ที่ไม่ใช่ GET · ไม่แตะ cross-origin (รูป Supabase ไม่ถูกแคช)
 *  - หน้าเว็บ = network-first (ออนไลน์ได้ของสดเสมอ, ออฟไลน์ค่อยใช้แคช/หน้า offline)
 *  - ไฟล์ build (_next/static) = cache-first (ชื่อไฟล์มี hash เปลี่ยนทุก deploy อยู่แล้ว)
 *  - รูปในโดเมนเรา = stale-while-revalidate จำกัด 60 รายการ
 * KILL SWITCH: ถ้าอยากปิด PWA ให้แทนที่ไฟล์นี้ทั้งไฟล์ด้วยโค้ดใน scripts/sw-kill.js แล้ว deploy
 */
const VERSION = "pl-sw-v1";
const PAGE_CACHE = VERSION + "-pages";
const STATIC_CACHE = VERSION + "-static";
const IMG_CACHE = VERSION + "-img";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await cache.delete(keys[0]).then(() => trimCache(name, max));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // cross-origin ปล่อยผ่าน (รูป Supabase, GA)
  if (url.pathname.startsWith("/api/")) return;      // API สดเสมอ ห้ามแคชเด็ดขาด

  // ไฟล์ build มี hash — cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // รูปในโดเมนเรา — stale-while-revalidate + จำกัดจำนวน
  if (req.destination === "image") {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req).then((res) => {
          if (res.ok) { cache.put(req, res.clone()); trimCache(IMG_CACHE, 60); }
          return res;
        }).catch(() => hit);
        return hit || refresh;
      })
    );
    return;
  }

  // เปิดหน้า (navigation) — network-first, ล่มค่อย fallback แคช → หน้า offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        caches.open(PAGE_CACHE).then((c) => { c.put(req, res.clone()); trimCache(PAGE_CACHE, 30); });
        return res;
      }).catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL)))
    );
  }
});
