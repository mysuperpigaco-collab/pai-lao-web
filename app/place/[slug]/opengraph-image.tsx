import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// share card อัตโนมัติ 1200×630 ของหน้าสถานที่
export const runtime = "nodejs"; // prisma ใช้ edge ไม่ได้
export const alt = "ไปเล่า — สถานที่เที่ยวทั่วไทย";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORY_TH: Record<string, string> = {
  NATURE: "ธรรมชาติ", CAFE: "คาเฟ่", ACCOMMODATION: "ที่พัก", CAMPING: "แคมป์ปิ้ง",
  FOOD: "ร้านอาหาร", TEMPLE: "วัด/ศาสนสถาน", BEACH: "ทะเล/ชายหาด", MARKET: "ตลาด",
  ADVENTURE: "สายลุย", MUSEUM: "พิพิธภัณฑ์",
};

async function loadThaiFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600&text=${encodeURIComponent(text)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
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

  const place = await prisma.place.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: {
      title: true, category: true, coverUrl: true, approvalStatus: true,
      province: true, district: true,
      reviews: { select: { rating: true } },
    },
  }).catch(() => null);

  const ok = place && place.approvalStatus === "APPROVED";

  const title    = ok ? place.title : "ไปเล่า — สถานที่เที่ยวทั่วไทย";
  const category = ok ? (CATEGORY_TH[place.category as string] ?? "") : "";
  const cover    = ok ? place.coverUrl : "";
  const loc      = ok ? [place.district && `อ.${place.district}`, place.province].filter(Boolean).join(" · ") : "";
  const ratings  = ok ? place.reviews.map(r => r.rating) : [];
  const avg      = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : "";

  const meta = [loc, avg ? `★ ${avg} จาก ${ratings.length} รีวิว` : ""].filter(Boolean).join("  ·  ");

  const font = await loadThaiFont(`${title}${meta}${category}ไปเล่า · pai-lao.com★`);

  // ฟอนต์โหลดไม่ได้ → การ์ดรูปปกล้วน (satori render ตัวอักษรไม่ได้ถ้าไม่มีฟอนต์)
  if (!font) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#185FA5" }}>
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
          backgroundColor: "#185FA5", position: "relative",
          fontFamily: "NotoSansThai",
        }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" width={1200} height={630}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}

          <div style={{
            position: "absolute", top: 32, left: 32, display: "flex", alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 999, padding: "12px 28px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#04342C", display: "flex" }}>ไปเล่า · pai-lao.com</div>
          </div>

          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            backgroundColor: "rgba(3,22,42,0.84)", padding: "30px 44px 34px",
          }}>
            {category ? (
              <div style={{
                display: "flex", backgroundColor: "#E6F1FB", color: "#0C447C",
                fontSize: 22, padding: "6px 24px", borderRadius: 999, marginBottom: 14,
              }}>{category}</div>
            ) : null}
            <div style={{
              display: "flex", fontSize: 52, fontWeight: 600, color: "#ffffff",
              lineHeight: 1.25, maxWidth: 1100,
            }}>
              {title.length > 70 ? title.slice(0, 70) + "…" : title}
            </div>
            {meta ? (
              <div style={{ display: "flex", fontSize: 26, color: "#B5D4F4", marginTop: 12 }}>{meta}</div>
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
    console.error("[og] place card failed — fallback:", e);
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#185FA5" }} />,
      size
    );
  }
}
