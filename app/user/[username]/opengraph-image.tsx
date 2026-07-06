import { ImageResponse } from "next/og";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

// share card โปรไฟล์นักรีวิว 1200×630
export const runtime = "nodejs";
export const alt = "ไปเล่า — โปรไฟล์นักเดินทาง";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function imgToDataUri(url: string, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(w, h, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

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

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username: decodeURIComponent(username) },
    select: {
      displayName: true, firstName: true, avatarUrl: true, profilePrivacy: true,
      profileCovers: true, coverUrl: true,
      _count: { select: { trips: true, followers: true } },
    },
  }).catch(() => null);

  const name  = user ? (user.displayName || user.firstName || `@${username}`) : "ไปเล่า";
  const stats = user ? `${user._count.trips} ทริป  ·  ${user._count.followers} ผู้ติดตาม` : "";
  const isPrivate = user?.profilePrivacy === "PRIVATE";

  // พื้นหลัง = รูป cover โปรไฟล์ (ถ้ามี + ไม่ private) · avatar วงกลม
  const coverSrc  = !isPrivate ? (user?.profileCovers?.[0] || user?.coverUrl || "") : "";
  const [coverBg, avatar] = await Promise.all([
    coverSrc ? imgToDataUri(coverSrc, 1200, 630) : Promise.resolve(null),
    user?.avatarUrl ? imgToDataUri(user.avatarUrl, 220, 220) : Promise.resolve(null),
  ]);

  const font = await loadThaiFont(`${name}${stats}@${username}นักเดินทางบนไปเล่า · pai-lao.com`);

  if (!font) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#0F6E56" }}>
          {coverBg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverBg} alt="" width={1200} height={630}
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
          fontFamily: "ChakraPetch",
        }}>
          {coverBg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverBg} alt="" width={1200} height={630}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
          {/* ฟิล์มทึบให้ตัวหนังสือ/avatar เด่นบนทุกพื้นหลัง */}
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(4,32,28,0.55)", display: "flex" }} />

          <div style={{
            position: "absolute", top: 32, left: 32, display: "flex", alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 999, padding: "12px 28px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#04342C", display: "flex" }}>ไปเล่า · pai-lao.com</div>
          </div>

          {/* avatar + ชื่อ กลางการ์ด */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", paddingTop: 30,
          }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" width={200} height={200}
                style={{ width: 200, height: 200, borderRadius: 999, border: "6px solid rgba(255,255,255,0.9)" }} />
            ) : (
              <div style={{
                width: 200, height: 200, borderRadius: 999, backgroundColor: "#9FE1CB",
                border: "6px solid rgba(255,255,255,0.9)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 96, fontWeight: 600, color: "#04342C",
              }}>{name.charAt(0)}</div>
            )}
            <div style={{ display: "flex", fontSize: 56, fontWeight: 600, color: "#ffffff", marginTop: 26 }}>
              {name.length > 30 ? name.slice(0, 30) + "…" : name}
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#9FE1CB", marginTop: 8 }}>
              @{decodeURIComponent(username)}{stats && !isPrivate ? `  ·  ${stats}` : ""}
            </div>
            <div style={{
              display: "flex", marginTop: 22, backgroundColor: "#E1F5EE", color: "#085041",
              fontSize: 24, padding: "8px 30px", borderRadius: 999,
            }}>นักเดินทางบนไปเล่า</div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [{ name: "ChakraPetch", data: font, weight: 600 as const, style: "normal" as const }],
      }
    );
  } catch (e) {
    console.error("[og] profile card failed — fallback:", e);
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#0F6E56" }} />,
      size
    );
  }
}
