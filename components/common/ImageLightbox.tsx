"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** โหมดเดิม: รูปเดียว (backward-compatible — จุดเรียกเก่าไม่ต้องแก้) */
  src?: string;
  alt?: string;
  /** โหมดใหม่: หลายรูป — ปัด/ลูกศร/คีย์บอร์ด/จุดบอกตำแหน่ง */
  images?: string[];
  startIndex?: number;
  /** คำบรรยายใต้รูป จับคู่ index กับ images (เช่น ชื่อจุดแวะ) */
  captions?: (string | null | undefined)[];
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, images, startIndex = 0, captions, onClose }: Props) {
  const list = images && images.length > 0 ? images : src ? [src] : [];
  const [idx, setIdx] = useState(() => Math.min(Math.max(startIndex, 0), Math.max(list.length - 1, 0)));
  const [zoom, setZoom] = useState(false);
  const [dragX, setDragX] = useState(0);
  const downX = useRef<number | null>(null);
  const reduced = useRef(false);

  const prev = useCallback(() => { setZoom(false); setIdx(i => (i - 1 + list.length) % list.length); }, [list.length]);
  const next = useCallback(() => { setZoom(false); setIdx(i => (i + 1) % list.length); }, [list.length]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && list.length > 1) prev();
      else if (e.key === "ArrowRight" && list.length > 1) next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next, list.length]);

  if (list.length === 0) return null;
  const multi = list.length > 1;
  const caption = captions?.[idx];

  // ── ปัด (นิ้วมือถือ + ลากเมาส์) — ปิดตอนซูมอยู่ ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom || !multi) return;
    // capture ไว้ที่ตัวรูป — ปล่อยนิ้ว/เมาส์นอกรูปแล้ว pointerup ยังมาถึง (กันรูปค้างกลางทาง)
    e.currentTarget.setPointerCapture(e.pointerId);
    downX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (downX.current === null) return;
    setDragX(e.clientX - downX.current);
  };
  const onPointerUp = () => {
    if (downX.current === null) return;
    const dx = dragX;
    downX.current = null;
    setDragX(0);
    if (dx < -50) next();
    else if (dx > 50) prev();
  };

  const btn: React.CSSProperties = {
    background: "rgba(255,255,255,0.14)", border: "none", color: "#fff",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "50%", lineHeight: 1, padding: 0,
  };

  return (
    <div
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        touchAction: "none", cursor: "zoom-out",
      }}
    >
      {multi && (
        <span style={{
          position: "absolute", top: 14, left: 16, zIndex: 2,
          color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600,
          background: "rgba(0,0,0,0.45)", padding: "4px 12px", borderRadius: 999,
        }}>
          {idx + 1} / {list.length}
        </span>
      )}

      <button onClick={onClose} aria-label="ปิด"
        style={{ ...btn, position: "absolute", top: 10, right: 10, width: 42, height: 42, fontSize: 18, zIndex: 2 }}>✕</button>

      {multi && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="รูปก่อนหน้า"
            style={{ ...btn, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, fontSize: 26, zIndex: 2 }}>‹</button>
          <button onClick={e => { e.stopPropagation(); next(); }} aria-label="รูปถัดไป"
            style={{ ...btn, position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, fontSize: 26, zIndex: 2 }}>›</button>
        </>
      )}

      <img
        key={idx}
        src={list[idx]}
        alt={alt ?? caption ?? `รูปที่ ${idx + 1}`}
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => { e.stopPropagation(); setZoom(z => !z); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        draggable={false}
        style={{
          maxWidth: "92vw", maxHeight: "84vh",
          objectFit: "contain", borderRadius: 12,
          transform: `translateX(${dragX}px) scale(${zoom ? 2 : 1})`,
          transition: downX.current !== null || reduced.current ? "none" : "transform 0.25s ease",
          cursor: zoom ? "zoom-out" : multi ? "grab" : "default",
          userSelect: "none", WebkitUserSelect: "none",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      />

      <div style={{
        position: "absolute", bottom: 14, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        pointerEvents: "none",
      }}>
        {caption && (
          <span style={{
            color: "rgba(255,255,255,0.92)", fontSize: 13,
            background: "rgba(0,0,0,0.45)", padding: "4px 14px", borderRadius: 999,
            maxWidth: "80vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{caption}</span>
        )}
        {multi && list.length <= 10 && (
          <div style={{ display: "flex", gap: 6, pointerEvents: "auto" }}>
            {list.map((_, i) => (
              <button key={i} aria-label={`ไปรูปที่ ${i + 1}`}
                onClick={e => { e.stopPropagation(); setZoom(false); setIdx(i); }}
                style={{
                  width: i === idx ? 18 : 7, height: 7, borderRadius: 4,
                  border: "none", padding: 0, cursor: "pointer",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: reduced.current ? "none" : "all 0.2s",
                }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
