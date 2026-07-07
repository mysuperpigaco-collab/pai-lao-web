/* KILL SWITCH — ถ้า PWA มีปัญหาบน prod:
 * 1) ก๊อปเนื้อหาไฟล์นี้ทั้งหมดไปทับ public/sw.js
 * 2) git add -A / commit / push (deploy)
 * ผู้ใช้ทุกคนที่เปิดเว็บครั้งถัดไป service worker จะถอนตัวเอง + ล้างแคชทั้งหมด กลับเป็นเว็บธรรมดา 100%
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((c) => c.navigate(c.url));
});
