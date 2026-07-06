"use client";
import React, { useState } from "react";
import ImageLightbox from "@/components/common/ImageLightbox";

interface Props {
  placeId: string;
  realCoverUrl: string | null;
  communityImages: string[];
  isAdmin: boolean;
}

export default function PlaceHero({ placeId, realCoverUrl, communityImages, isAdmin }: Props) {
  // All photos: real cover first, then community
  const allPhotos: string[] = [];
  if (realCoverUrl) allPhotos.push(realCoverUrl);
  allPhotos.push(...communityImages);

  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const current = allPhotos[idx] ?? null;
  const total = allPhotos.length;

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  async function setCover(url: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/places/cover", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, coverUrl: url }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!current) {
    // No photos at all — show gradient
    return (
      <div className="pd-hero-img" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }} />
    );
  }

  return (
    <>
      {/* Hero image with nav arrows */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <img
          src={current}
          alt="Place cover"
          className="pd-hero-img"
          style={{ cursor: "zoom-in" }}
          onClick={() => setLightbox(true)}
        />

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button onClick={prev} style={arrowStyle("left")} aria-label="Previous photo">‹</button>
            <button onClick={next} style={arrowStyle("right")} aria-label="Next photo">›</button>
            {/* Counter */}
            <span style={{
              position: "absolute", bottom: 14, right: 16, zIndex: 10,
              background: "rgba(0,0,0,0.5)", color: "white",
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
              backdropFilter: "blur(6px)",
            }}>
              {idx + 1} / {total}
            </span>
            {/* Dots */}
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 10 }}>
              {allPhotos.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 20 : 7, height: 7, borderRadius: 999,
                  background: i === idx ? "white" : "rgba(255,255,255,0.5)",
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "all 0.2s",
                }} />
              ))}
            </div>
          </>
        )}

        {/* Admin: set as cover button */}
        {isAdmin && current !== realCoverUrl && (
          <button
            onClick={() => setCover(current)}
            disabled={saving}
            style={{
              position: "absolute", top: 14, right: 16, zIndex: 10,
              background: saved ? "rgba(16,185,129,0.9)" : "rgba(0,0,0,0.55)",
              color: "white", border: "none", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              backdropFilter: "blur(6px)",
              transition: "background 0.2s",
            }}
          >
            {saved ? "✓ ตั้งเป็นปกแล้ว" : saving ? "กำลังบันทึก..." : "📌 ตั้งเป็นรูปปก"}
          </button>
        )}
      </div>

      {/* Thumbnail strip (if multiple) */}
      {total > 1 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 9,
          display: "flex", gap: 4, padding: "8px 12px 8px",
          overflowX: "auto", scrollbarWidth: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
        }}>
          {allPhotos.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              flexShrink: 0, width: 44, height: 32, borderRadius: 6, overflow: "hidden",
              border: i === idx ? "2px solid white" : "2px solid transparent",
              padding: 0, cursor: "pointer", opacity: i === idx ? 1 : 0.65,
              transition: "opacity 0.2s, border 0.2s",
            }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — ตัวกลางร่วมทั้งเว็บ เปิดจากรูปที่กำลังดู ปัดต่อได้ทุกรูป */}
      {lightbox && (
        <ImageLightbox
          images={allPhotos}
          startIndex={idx}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%", transform: "translateY(-50%)",
    [side]: 12,
    zIndex: 10,
    background: "rgba(0,0,0,0.45)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: 36, height: 36,
    fontSize: 22, lineHeight: "1",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
    transition: "background 0.2s",
  };
}
