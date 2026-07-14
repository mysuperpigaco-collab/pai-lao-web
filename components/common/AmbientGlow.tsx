"use client";

import { useEffect, useRef, useState } from "react";

// ── Ambient glow: แสงเรืองสีตามรูปปก วางไว้ "หลัง" hero ────────
// อ่านสีเด่นจากรูปด้วย canvas (client) → วาด radial-gradient เบลอ
// zero backend: ทำงานกับรูปเก่าทุกใบ · อ่านรูปข้าม origin ไม่ได้ = ไม่โชว์ (graceful)
//
// วิธีใช้: วางเป็น element แรกใน container ที่ position:relative แล้วให้ hero อยู่ทับ
//   <div style={{position:"relative"}}>
//     <AmbientGlow src={coverUrl} />
//     <div className="hero"> ... </div>
//   </div>

type Props = {
  src?: string | null;
  /** ความแรงของแสง (0-1) ดีฟอลต์ 0.5 */
  intensity?: number;
};

export default function AmbientGlow({ src, intensity = 0.5 }: Props) {
  const [colors, setColors] = useState<[string, string] | null>(null);
  const doneFor = useRef<string | null>(null);

  useEffect(() => {
    if (!src || doneFor.current === src) return;
    // เคารพผู้ใช้ที่ปิดอนิเมชัน — ไม่ถึงกับต้องปิด glow แต่ไม่ทำ transition แรง
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous"; // ต้องมี ไม่งั้น getImageData โยน (tainted)
    img.onload = () => {
      if (cancelled) return;
      try {
        const w = 12, h = 12; // ย่อจิ๋ว พอสำหรับหาสีเฉลี่ยเป็นโซน
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        // สีเฉลี่ยครึ่งบน + ครึ่งล่าง (ให้ glow มีสองโทนไล่ตามรูป)
        const avg = (y0: number, y1: number): string => {
          let r = 0, g = 0, b = 0, n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
            }
          }
          // ดันความอิ่มตัวขึ้นนิดให้แสงมีสีสัน ไม่จืด
          const boost = (v: number) => Math.min(255, Math.round(v / n * 1.08));
          return `rgb(${boost(r)},${boost(g)},${boost(b)})`;
        };

        doneFor.current = src;
        setColors([avg(0, h / 2), avg(h / 2, h)]);
      } catch {
        // tainted canvas / อ่านไม่ได้ → ไม่โชว์ glow
      }
    };
    img.onerror = () => {};
    img.src = src;

    return () => { cancelled = true; };
  }, [src]);

  if (!colors) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "-8% -4%",
        zIndex: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        filter: "blur(48px)",
        opacity: intensity,
        background: `radial-gradient(ellipse at 28% 32%, ${colors[0]} 0%, transparent 62%), radial-gradient(ellipse at 74% 70%, ${colors[1]} 0%, transparent 62%)`,
        transition: "opacity 0.9s ease",
      }}
    />
  );
}
