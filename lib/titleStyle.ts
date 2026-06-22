// สไตล์หัวข้อทริป (titleStyle) — ใช้ร่วมกันทั้งฟอร์มสร้าง/แก้ไข, การ์ด และหัวหน้าทริป
import type { CSSProperties } from "react";

export interface TitleStylePreset {
  key: string;
  label: string;
  /** css สำหรับตัวอักษรปกติ (สีทึบ/ตัวหนา/ฟอนต์) */
  css?: CSSProperties;
  /** ถ้าเป็นไล่เฉดสี เก็บ gradient ไว้ (จะ clip เป็นสีตัวอักษร) */
  grad?: string;
}

export const TITLE_STYLES: TitleStylePreset[] = [
  { key: "none",   label: "ปกติ" },
  { key: "bold",   label: "ตัวหนา",   css: { fontWeight: 900 } },
  { key: "serif",  label: "คลาสสิก",  css: { fontFamily: "Georgia, 'Times New Roman', serif" } },
  { key: "red",    label: "แดงเข้ม",  css: { color: "#dc2626", fontWeight: 800 } },
  { key: "sunset", label: "ไล่ส้ม",   grad: "linear-gradient(90deg,#f97316,#ec4899)" },
  { key: "ocean",  label: "ไล่ฟ้า",   grad: "linear-gradient(90deg,#0891b2,#10b981)" },
  { key: "purple", label: "ไล่ม่วง",  grad: "linear-gradient(90deg,#7c3aed,#db2777)" },
  { key: "gold",   label: "ทองหรู",   grad: "linear-gradient(90deg,#b8860b,#f59e0b)" },
];

/**
 * คืน inline style ของหัวข้อตาม preset
 * - ปกติ: คืน {} (ใช้สีเดิมของที่นั้น ๆ)
 * - ไล่เฉด: clip gradient เป็นสีตัวอักษร
 */
export function titleStyleCss(key?: string | null): CSSProperties {
  const preset = TITLE_STYLES.find(s => s.key === key);
  if (!preset || preset.key === "none") return {};
  if (preset.grad) {
    return {
      background: preset.grad,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      fontWeight: 800,
    };
  }
  return preset.css ?? {};
}
