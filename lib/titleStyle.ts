// สไตล์หัวข้อทริป (titleStyle) — แยก 2 หมวด: แบบตัวอักษร (font) + สี (color)
// เก็บในฟิลด์เดียวเป็นสตริง "font|color" เช่น "bold|purple"
import type { CSSProperties } from "react";

export interface FontPreset { key: string; label: string; css?: CSSProperties; }
export interface ColorPreset { key: string; label: string; color?: string; grad?: string; }

// ── แบบตัวอักษร (เลือกได้ 1) ──
export const TITLE_FONTS: FontPreset[] = [
  { key: "normal", label: "ปกติ" },
  { key: "bold",   label: "ตัวหนา",   css: { fontWeight: 900 } },
  { key: "serif",  label: "คลาสสิก",  css: { fontFamily: "Georgia, 'Times New Roman', serif" } },
];

// ── สี (เลือกได้ 1) ──
export const TITLE_COLORS: ColorPreset[] = [
  { key: "default", label: "ปกติ" },
  { key: "red",     label: "แดงเข้ม", color: "#dc2626" },
  { key: "sunset",  label: "ไล่ส้ม",  grad: "linear-gradient(90deg,#f97316,#ec4899)" },
  { key: "ocean",   label: "ไล่ฟ้า",  grad: "linear-gradient(90deg,#0891b2,#10b981)" },
  { key: "purple",  label: "ไล่ม่วง", grad: "linear-gradient(90deg,#7c3aed,#db2777)" },
  { key: "gold",    label: "ทองหรู",  grad: "linear-gradient(90deg,#b8860b,#f59e0b)" },
];

const COLOR_KEYS = new Set(TITLE_COLORS.map(c => c.key));
const FONT_KEYS  = new Set(TITLE_FONTS.map(f => f.key));

/** แยกค่าที่เก็บไว้เป็น { font, color } — รองรับค่าเก่าที่เป็นคีย์เดี่ยว */
export function parseTitleStyle(value?: string | null): { font: string; color: string } {
  if (!value || value === "none") return { font: "normal", color: "default" };
  if (value.includes("|")) {
    const [f, c] = value.split("|");
    return {
      font:  FONT_KEYS.has(f)  ? f : "normal",
      color: COLOR_KEYS.has(c) ? c : "default",
    };
  }
  // ค่าเก่า: คีย์เดี่ยว
  if (FONT_KEYS.has(value))  return { font: value, color: "default" };
  if (COLOR_KEYS.has(value)) return { font: "normal", color: value };
  return { font: "normal", color: "default" };
}

/** รวมค่า font + color เป็นสตริงเดียวสำหรับเก็บ */
export function buildTitleStyle(font: string, color: string): string {
  return `${font}|${color}`;
}

function colorCss(colorKey: string): CSSProperties {
  const c = TITLE_COLORS.find(x => x.key === colorKey);
  if (!c || c.key === "default") return {};
  if (c.grad) {
    return {
      backgroundImage: c.grad,           // ใช้ backgroundImage ไม่ใช่ background shorthand (กัน reset background-clip)
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }
  return { color: c.color };
}

function fontCss(fontKey: string): CSSProperties {
  return TITLE_FONTS.find(x => x.key === fontKey)?.css ?? {};
}

/** คืน inline style ของหัวข้อ (รวมทั้ง font + color) */
export function titleStyleCss(value?: string | null): CSSProperties {
  const { font, color } = parseTitleStyle(value);
  return { ...fontCss(font), ...colorCss(color) };
}
