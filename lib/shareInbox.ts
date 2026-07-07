// ── Web Share Target inbox (client only) ────────────────────
// sw.js (handleShareTarget) เก็บรูปที่ผู้ใช้แชร์เข้ามาไว้ใน Cache ชื่อ "*-share"
// ที่ path /__pl-share/<n> — ฝั่งหน้า create เรียก readSharedFiles() ตอน mount
// เพื่อดึงรูปออกมาแนบเข้าฟอร์ม แล้วลบทิ้งจาก cache (อ่านครั้งเดียวหาย)

const SHARE_PATH_PREFIX = "/__pl-share/";

export async function readSharedFiles(): Promise<File[]> {
  if (typeof window === "undefined" || !("caches" in window)) return [];
  try {
    // หา share cache จากชื่อ (ไม่ hardcode เวอร์ชัน sw — bump แล้วโค้ดนี้ไม่ต้องแก้)
    const names = await caches.keys();
    const shareName = names.find((n) => n.endsWith("-share"));
    if (!shareName) return [];

    const cache = await caches.open(shareName);
    const requests = (await cache.keys())
      .filter((r) => new URL(r.url).pathname.startsWith(SHARE_PATH_PREFIX))
      .sort((a, b) => a.url.localeCompare(b.url, undefined, { numeric: true }));

    const files: File[] = [];
    for (const req of requests) {
      const res = await cache.match(req);
      if (!res) continue;
      const blob = await res.blob();
      if (blob.size === 0) continue;
      const rawName = res.headers.get("X-File-Name");
      let name = "shared.jpg";
      try { name = rawName ? decodeURIComponent(rawName) : name; } catch {}
      files.push(new File([blob], name, { type: blob.type || "image/jpeg" }));
    }

    // อ่านแล้วเคลียร์ทิ้ง — กันรูปเดิมโผล่ซ้ำรอบหน้า
    await Promise.all((await cache.keys()).map((r) => cache.delete(r)));
    return files;
  } catch {
    return [];
  }
}
