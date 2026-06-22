// สไตล์หัวข้อทริป (titleStyle) — เหลือเฉพาะ "แบบตัวอักษร" (font) เลือกได้ 1
// เก็บในฟิลด์เดียวเป็นคีย์ฟอนต์ เช่น "bold"
import type { CSSProperties } from "react";

export interface FontPreset { key: string; label: string; css?: CSSProperties; }

export const TITLE_FONTS: FontPreset[] = [
  { key: "normal", label: "ปกติ",     css: { fontWeight: 500 } },
  { key: "bold",   label: "ตัวหนา",   css: { fontWeight: 900 } },
  { key: "serif",  label: "คลาสสิก",  css: { fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontStyle: "italic" } },
];

const FONT_KEYS = new Set(TITLE_FONTS.map(f => f.key));

/** ดึงคีย์ฟอนต์จากค่าที่เก็บไว้ — รองรับค่าเก่าทั้งแบบ "font|color" และคีย์เดี่ยว */
export function parseTitleFont(value?: string | null): string {
  if (!value || value === "none") return "normal";
  const head = value.includes("|") ? value.split("|")[0] : value;
  return FONT_KEYS.has(head) ? head : "normal";
}

/** คืน inline style ของหัวข้อ (เฉพาะแบบตัวอักษร)
 *  ค่าที่ไม่ได้ตั้ง (null/none) คืน {} เพื่อคงน้ำหนักเดิมของแต่ละที่ ไม่กระทบทริปเก่า */
export function titleStyleCss(value?: string | null): CSSProperties {
  if (!value || value === "none") return {};
  const font = parseTitleFont(value);
  return TITLE_FONTS.find(f => f.key === font)?.css ?? {};
}
