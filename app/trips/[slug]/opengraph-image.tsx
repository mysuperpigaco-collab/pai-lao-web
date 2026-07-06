import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// share card อัตโนมัติ 1200×630 — LINE/Facebook/X ดึงไฟล์นี้ตอนแชร์ลิงก์ทริป
// ImageResponse ผลิต PNG เสมอ → ไม่มีปัญหา webp preview ใน LINE
export const runtime = "nodejs"; // ต้องเป็น nodejs (prisma ใช้ edge ไม่ได้)
export const alt = "ไปเล่า — เรื่องเล่าการเดินทาง";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// โหลดฟอนต์ไทยแบบ subset เฉพาะตัวอักษรที่ใช้จริง (ไฟล์เล็ก เร็ว)
async function loadThaiFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600&text=${encodeURIComponent(text)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } } // ให้ Google คืน TTF ไม่ใช่ woff2 (satori ไม่รับ woff2)
      )
    ).text();
    const url = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const trip = await prisma.trip.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: {
      title: true, mood: true, coverUrl: true,
      approvalStatus: true, isPublished: true,
      author: { select: { displayName: true, firstName: true } },
      timeline: { select: { province: true }, take: 1, orderBy: { order: "asc" } },
      reviews: { select: { rating: true } },
      _count: { select: { timeline: true } },
    },
  }).catch(() => null);

  // ทริปไม่พบ/ยังไม่อนุมัติ → การ์ดแบรนด์กลาง ๆ (ไม่ leak ชื่อทริปที่ยังไม่ผ่านตรวจ)
  const ok = trip && trip.approvalStatus === "APPROVED" && trip.isPublished;

  const title    = ok ? trip.title : "ไปเล่า — เล่าเรื่องทริป ปักหมุดที่เที่ยวทั่วไทย";
  const mood     = ok ? trip.mood : "";
  const author   = ok ? (trip.author?.displayName || trip.author?.firstName || "") : "";
  const province = ok ? (trip.timeline?.[0]?.province || "") : "";
  const stops    = ok ? trip._count.timeline : 0;
  const ratings  = ok ? trip.reviews.map(r => r.rating) : [];
  const avg      = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "";
  const cover    = ok ? trip.coverUrl : "";

  const meta = [
    stops ? `${stops} จุดแวะ` : "",
    province,
    avg ? `★ ${avg}` : "",
    author ? `โดย ${author}` : "",
  ].filter(Boolean).join("  ·  ");

  const fontText = `${title}${meta}${mood}ไปเล่า · pai-lao.com★`;
  const font = await loadThaiFont(fontText);

  // ฟอนต์โหลดไม่ได้ → การ์ดรูปปกล้วน (satori render ตัวอักษรไม่ได้ถ้าไม่มีฟอนต์)
  if (!font) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#0F6E56" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" width={1200} height={630}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </div>
      ),
      size
    );
  }

  try {
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%", display: "flex",
          backgroundColor: "#0F6E56", position: "relative",
          fontFamily: "NotoSansThai",
        }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" width={1200} height={630}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}

          {/* ป้ายโลโก้มุมบนซ้าย */}
          <div style={{
            position: "absolute", top: 32, left: 32, display: "flex", alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 999, padding: "12px 28px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#04342C", display: "flex" }}>ไปเล่า · pai-lao.com</div>
          </div>

          {/* แถบข้อมูลล่าง */}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            backgroundColor: "rgba(4,32,28,0.84)", padding: "30px 44px 34px",
          }}>
            {mood ? (
              <div style={{
                display: "flex", backgroundColor: "#E1F5EE", color: "#085041",
                fontSize: 22, padding: "6px 24px", borderRadius: 999, marginBottom: 14,
              }}>{mood}</div>
            ) : null}
            <div style={{
              display: "flex", fontSize: 52, fontWeight: 600, color: "#ffffff",
              lineHeight: 1.25, maxWidth: 1100,
            }}>
              {title.length > 70 ? title.slice(0, 70) + "…" : title}
            </div>
            {meta ? (
              <div style={{ display: "flex", fontSize: 26, color: "#9FE1CB", marginTop: 12 }}>{meta}</div>
            ) : null}
          </div>
        </div>
      ),
      {
        ...size,
        fonts: font
          ? [{ name: "NotoSansThai", data: font, weight: 600 as const, style: "normal" as const }]
          : undefined,
      }
    );
  } catch (e) {
    console.error("[og] trip card failed — fallback:", e);
    // fallback สุดท้าย: การ์ดสีล้วนไม่มีตัวอักษร (กัน crawler ได้ 500)
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#0F6E56" }} />,
      size
    );
  }
}
