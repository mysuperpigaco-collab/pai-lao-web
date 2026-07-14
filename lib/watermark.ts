import { ImageResponse } from "next/og";
import sharp from "sharp";
import React from "react";
import { isOurStorageUrl } from "@/lib/imageUrl";

// ── ฝังลายน้ำแบบหลายเลเยอร์ (server only) ────────────────────
// เรนเดอร์ overlay โปร่งใสด้วย satori (ฟอนต์ไทย) → composite ทับด้วย sharp
// fail-open เสมอ · รองรับ text / tiled / badge / image(logo) · drag/rotate/pill/outline

const SITE = "pai-lao.com";
const MAX_LAYERS = 12;

export type WmLayer = {
  kind: "text" | "tiled" | "badge" | "image";
  text?: string;
  imageUrl?: string;
  x: number; y: number;      // 0-100 (%) จุดกึ่งกลาง
  rot: number;               // -180..180
  size: number;              // % ของความกว้างภาพ (px = W*size/100)
  color: string;             // hex
  opacity: number;           // 0.05-1
  bold?: boolean; italic?: boolean; outline?: boolean; pill?: boolean;
  gap?: number; reps?: number; // tiled: ระยะห่างบรรทัด · จำนวนซ้ำต่อแถว
};
export type WatermarkSettings = { enabled?: boolean; layers?: WmLayer[]; text?: string; style?: string; color?: string; opacity?: number; position?: string };

async function loadThaiFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&text=${encodeURIComponent(text)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      )
    ).text();
    const url = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch { return null; }
}

async function toDataUri(url: string): Promise<string | null> {
  try {
    if (!isOurStorageUrl(url)) return null; // กัน SSRF — parse hostname จริง ไม่ใช่ substring
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const png = await sharp(buf).resize({ width: 400, height: 400, fit: "inside" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch { return null; }
}

function outlineShadow(color: string): string {
  const oc = luminance(color) > 0.5 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  const d = "1px";
  return [`-${d} -${d} 0 ${oc}`, `${d} -${d} 0 ${oc}`, `-${d} ${d} 0 ${oc}`, `${d} ${d} 0 ${oc}`, `0 ${d} 0 ${oc}`, `0 -${d} 0 ${oc}`].join(",");
}
function softShadow(color: string): string {
  return luminance(color) > 0.5 ? "0 1px 3px rgba(0,0,0,0.55)" : "0 1px 2px rgba(255,255,255,0.45)";
}
function luminance(hex: string): number {
  const c = (hex || "#ffffff").replace("#", "");
  if (c.length < 6) return 1;
  const r = parseInt(c.slice(0, 2), 16) / 255, g = parseInt(c.slice(2, 4), 16) / 255, b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function layerEl(L: WmLayer, W: number, idx: number, dataUri: string | null) {
  const px = Math.max(8, Math.round(W * (L.size || 4) / 100));
  const shadow = L.outline ? outlineShadow(L.color) : softShadow(L.color);
  const base: React.CSSProperties = {
    position: "absolute", left: `${L.x}%`, top: `${L.y}%`,
    transform: `translate(-50%,-50%) rotate(${L.rot || 0}deg)`,
    opacity: Math.min(1, Math.max(0.05, L.opacity ?? 0.8)),
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const key = `L${idx}`;

  if (L.kind === "image" && dataUri) {
    return React.createElement("div", { key, style: base },
      React.createElement("img", { src: dataUri, width: px * 2, height: px * 2, style: { objectFit: "contain" } }));
  }

  const text = (L.text || "").slice(0, 40) || SITE;
  const textCss: React.CSSProperties = {
    fontSize: px, fontWeight: L.bold ? 700 : 600, fontStyle: L.italic ? "italic" : "normal",
    color: L.color || "#ffffff", textShadow: shadow, whiteSpace: "nowrap", display: "flex",
  };

  if (L.kind === "tiled") {
    // เต็มกรอบทะลุขอบ · ปรับระยะห่าง (gap) + จำนวนซ้ำต่อแถว (reps) ได้
    const gap = L.gap ?? 1.3, reps = Math.max(2, Math.round(L.reps ?? 5));
    const rowCount = Math.max(6, Math.round(24 / gap));
    const rowText = `${text}     ${SITE}     `.repeat(reps);
    const rows = Array.from({ length: rowCount }).map((_, i) =>
      React.createElement("div", { key: i, style: { ...textCss, marginBottom: Math.round(px * gap) } }, rowText));
    return React.createElement("div", { key, style: { ...base, width: W * 2.6, flexDirection: "column", justifyContent: "center" } }, rows);
  }

  if (L.kind === "badge") {
    const d = px * 3;
    return React.createElement("div", { key, style: base },
      React.createElement("div", { style: { width: d, height: d, borderRadius: d, border: `${Math.max(1, Math.round(px * 0.06))}px solid ${L.color}`, background: "rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
        [
          React.createElement("div", { key: "n", style: { fontSize: Math.round(px * 0.6), fontWeight: 700, color: L.color, textShadow: shadow, display: "flex", lineHeight: 1 } }, text),
          React.createElement("div", { key: "s", style: { fontSize: Math.round(px * 0.3), color: L.color, textShadow: shadow, display: "flex", marginTop: 2 } }, SITE),
        ]));
  }

  // text (มี site เล็กใต้ + pill optional)
  const inner = React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
    [
      React.createElement("div", { key: "n", style: textCss }, text),
      React.createElement("div", { key: "s", style: { ...textCss, fontSize: Math.round(px * 0.42), fontWeight: 500, marginTop: 1 } }, SITE),
    ]);
  const wrap: React.CSSProperties = L.pill
    ? { ...base, background: "rgba(15,23,42,0.42)", borderRadius: 999, padding: `${Math.round(px * 0.3)}px ${Math.round(px * 0.7)}px` }
    : base;
  return React.createElement("div", { key, style: wrap }, inner);
}

// แปลงค่าเก่า (preset เดิม) → layer เดียว เพื่อไม่ให้ของที่ตั้งไว้แล้วหาย
function migrate(s: WatermarkSettings): WmLayer[] {
  if (Array.isArray(s.layers)) return s.layers;
  if (s.text || s.style) {
    return [{ kind: (s.style === "tiled" || s.style === "badge" || s.style === "center") ? (s.style === "center" ? "text" : s.style as any) : "text",
      text: s.text || SITE, x: 78, y: 82, rot: s.style === "tiled" ? -28 : 0, size: 4,
      color: s.color === "#0f172a" ? "#0f172a" : "#ffffff", opacity: s.opacity ?? 0.55 }];
  }
  return [];
}

export async function applyWatermark(buffer: Buffer, raw: unknown): Promise<Buffer> {
  try {
    const s = (typeof raw === "object" && raw ? raw : {}) as WatermarkSettings;
    if (!s.enabled) return buffer;
    let layers = migrate(s).slice(0, MAX_LAYERS).filter(L => L && (L.kind === "image" ? L.imageUrl : true));
    if (!layers.length) return buffer;

    const meta = await sharp(buffer).metadata();
    const W = Math.min(2000, meta.width || 1200);
    const H = Math.round((meta.height || 800) * (W / (meta.width || 1200)));

    // ฟอนต์: subset รวมทุกข้อความ
    const allText = layers.map(L => L.text || "").join("") + SITE;
    const font = await loadThaiFont(allText);
    const fonts = font ? [{ name: "Chakra Petch", data: font, weight: 600 as const, style: "normal" as const }] : [];

    // โหลด data URI ของเลเยอร์รูปล่วงหน้า (satori embed รูป remote ไม่ได้)
    const uris = await Promise.all(layers.map(L => L.kind === "image" && L.imageUrl ? toDataUri(L.imageUrl) : Promise.resolve(null)));

    const children = layers.map((L, i) => layerEl(L, W, i, uris[i]));
    const overlay = React.createElement("div", { style: { width: W, height: H, position: "relative", display: "flex", overflow: "hidden" } }, children);

    const png = Buffer.from(await new ImageResponse(overlay, { width: W, height: H, fonts }).arrayBuffer());
    return await sharp(buffer).composite([{ input: png, top: 0, left: 0 }]).webp({ quality: 82 }).toBuffer();
  } catch (e) {
    console.error("[watermark] failed — using original:", e);
    return buffer;
  }
}
