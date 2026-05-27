"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ─────────────────────────────────────────────
   Lightbox
   ───────────────────────────────────────────── */
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 20,
        background: "none", border: "none", color: "#fff",
        fontSize: 32, cursor: "pointer", lineHeight: 1, zIndex: 2,
      }}>x</button>

      <span style={{
        position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
        color: "#cbd5e1", fontSize: 13, fontWeight: 600, letterSpacing: 1,
      }}>{idx + 1} / {images.length}</span>

      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); prev(); }} style={lbArrow("left")}>{"<"}</button>
      )}

      <img
        src={images[idx]}
        alt={"Photo " + (idx + 1)}
        onClick={e => e.stopPropagation()}
        loading="lazy"
        style={{
          maxWidth: "90vw", maxHeight: "88vh",
          objectFit: "contain", borderRadius: 10,
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)", display: "block",
        }}
      />

      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); next(); }} style={lbArrow("right")}>{">"}</button>
      )}
    </div>
  );
}

function lbArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
    fontSize: 44, lineHeight: 1, width: 52, height: 52, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2,
  };
}

/* ─────────────────────────────────────────────
   Owner Gallery
   ───────────────────────────────────────────── */
export function OwnerGallery({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [lb, setLb]   = useState<number | null>(null);
  const timer         = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIdx(i => (i + 1) % images.length),
      5000,
    );
  }, [images.length]);

  useEffect(() => {
    if (images.length > 1) resetTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [images.length, resetTimer]);

  const go = (dir: number) => {
    setIdx(i => (i + dir + images.length) % images.length);
    resetTimer();
  };

  if (!images.length) return null;

  return (
    <div>
      {lb !== null && (
        <Lightbox images={images} startIndex={lb} onClose={() => setLb(null)} />
      )}
      <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden" }}>
        <img
          src={images[idx]}
          alt={"Gallery " + (idx + 1)}
          loading="lazy"
          onClick={() => setLb(idx)}
          style={{
            width: "100%", height: 320, objectFit: "cover",
            display: "block", cursor: "zoom-in",
          }}
        />
        <span style={{
          position: "absolute", bottom: 12, right: 14,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          fontSize: 12, fontWeight: 700, padding: "3px 10px",
          borderRadius: 999, backdropFilter: "blur(4px)",
        }}>
          {idx + 1} / {images.length}
        </span>
        {images.length > 1 && (
          <div>
            <button onClick={() => go(-1)} style={carouselArrow("left")}>{"<"}</button>
            <button onClick={() => go(1)}  style={carouselArrow("right")}>{">"}</button>
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 6,
            }}>
              {images.map((_img, i) => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); resetTimer(); }}
                  style={{
                    width: i === idx ? 20 : 8, height: 8,
                    borderRadius: 4, border: "none", cursor: "pointer",
                    background: i === idx ? "#10b981" : "rgba(255,255,255,0.5)",
                    transition: "all 0.25s", padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function carouselArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", [side]: 10, top: "50%", transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.4)", border: "none", color: "#fff",
    fontSize: 32, lineHeight: 1, width: 40, height: 40, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1,
  };
}

/* ─────────────────────────────────────────────
   Placeholder card
   ───────────────────────────────────────────── */
function WaitingCard({ idx }: { idx: number }) {
  const phrases = [
    { th: "รอนักเดินทางมาเยือน", en: "Waiting for travelers", icon: "compass" },
    { th: "แชร์ทริปของคุณ",      en: "Share your trip here",  icon: "camera" },
    { th: "เป็นคนแรกที่บันทึก", en: "Be the first to capture", icon: "star" },
    { th: "ยังไม่มีภาพจากทริป", en: "No trip photos yet",     icon: "map" },
  ];
  const icons: Record<string, string> = {
    compass: "🧭", camera: "📸", star: "✨", map: "🗺️",
  };
  const p = phrases[idx % phrases.length];
  return (
    <div style={{
      flexShrink: 0, width: 200, height: 150, borderRadius: 10,
      background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
      border: "2px dashed #a7f3d0",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 6, padding: 12, textAlign: "center", userSelect: "none",
    }}>
      <span style={{ fontSize: 28 }}>{icons[p.icon]}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#065f46", lineHeight: 1.3 }}>{p.th}</span>
      <span style={{ fontSize: 10, color: "#64748b" }}>{p.en}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Community Gallery
   ───────────────────────────────────────────── */
export function CommunityGallery({
  images,
  minSlots = 4,
}: {
  images: string[];
  minSlots?: number;
}) {
  const [lb, setLb]  = useState<number | null>(null);
  const stripRef     = useRef<HTMLDivElement>(null);
  const animRef      = useRef<number | null>(null);
  const pausedRef    = useRef(false);

  const ITEM_W    = 200;
  const hasImages = images.length > 0;
  const REPEAT    = hasImages ? (images.length < 6 ? 4 : 2) : 0;
  const looped: string[] = [];
  for (let r = 0; r < REPEAT; r++) {
    for (let j = 0; j < images.length; j++) {
      looped.push(images[j]);
    }
  }
  // Only show placeholders when there are NO real images at all
  const placeholderCount = hasImages ? 0 : minSlots;

  useEffect(() => {
    const el = stripRef.current;
    if (!el || images.length <= 1) return;
    const totalW = images.length * (ITEM_W + 8);
    const tick = () => {
      if (!pausedRef.current) {
        el.scrollLeft += 0.6;
        if (el.scrollLeft >= totalW) el.scrollLeft = 0;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [images.length]);

  const doScroll = (dir: number) => {
    stripRef.current?.scrollBy({ left: dir * (ITEM_W + 8) * 3, behavior: "smooth" });
  };

  const realIdx = (displayIdx: number) => displayIdx % images.length;

  return (
    <div>
      {lb !== null && (
        <Lightbox images={images} startIndex={lb} onClose={() => setLb(null)} />
      )}
      <div style={{ position: "relative" }}>
        {hasImages && (
          <button onClick={() => doScroll(-1)} style={stripArrow("left")}>{"<"}</button>
        )}
        <div
          ref={stripRef}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          style={{
            display: "flex", gap: 8, overflowX: "auto",
            scrollbarWidth: "none", cursor: hasImages ? "grab" : "default",
            padding: "4px 0",
          }}
        >
          {looped.map((img, i) => (
            <div
              key={"img-" + i}
              onClick={() => setLb(realIdx(i))}
              style={{
                flexShrink: 0, width: ITEM_W, height: 150,
                borderRadius: 10, overflow: "hidden", cursor: "zoom-in",
              }}
            >
              <img
                src={img}
                alt={"Community " + (realIdx(i) + 1)}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
          {Array.from({ length: placeholderCount }).map((_v, i) => (
            <WaitingCard key={"ph-" + i} idx={i} />
          ))}
        </div>
        {hasImages && (
          <button onClick={() => doScroll(1)} style={stripArrow("right")}>{">"}</button>
        )}
        {hasImages ? (
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, textAlign: "right" }}>
            {images.length} รูปจากนักเดินทาง
          </p>
        ) : (
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, textAlign: "center" }}>
            ยังไม่มีนักเดินทางแชร์รูปจากสถานที่นี้ · Be the first to share!
          </p>
        )}
      </div>
    </div>
  );
}

function stripArrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", [side]: -16, top: "50%", transform: "translateY(-50%)",
    background: "#fff", border: "1px solid #e2e8f0", color: "#374151",
    fontSize: 22, lineHeight: 1, width: 36, height: 36, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  };
}
