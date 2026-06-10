"use client";

import { useState } from "react";
import { useEffect } from "react";

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
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
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 20,
        background: "none", border: "none", color: "#fff",
        fontSize: 32, cursor: "pointer", lineHeight: 1, zIndex: 2,
      }}>✕</button>

      <span style={{
        position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
        color: "#cbd5e1", fontSize: 13, fontWeight: 600, letterSpacing: 1,
      }}>{idx + 1} / {images.length}</span>

      {images.length > 1 && (
        <button onClick={e => { e.stopPropagation(); prev(); }} style={arrow("left")}>{"<"}</button>
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
        <button onClick={e => { e.stopPropagation(); next(); }} style={arrow("right")}>{">"}</button>
      )}
    </div>
  );
}

function arrow(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", [side]: 16, top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
    fontSize: 44, lineHeight: 1, width: 52, height: 52, borderRadius: "50%",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2,
  };
}

export default function PlaceGalleryGrid({ images, title }: { images: string[]; title: string }) {
  const [lb, setLb] = useState<number | null>(null);
  const shown = images.slice(0, 6);

  return (
    <div>
      {lb !== null && (
        <Lightbox images={images} startIndex={lb} onClose={() => setLb(null)} />
      )}
      <div className="pd-gallery">
        {shown.map((img, i) => (
          <div
            key={i}
            className="pd-gal-item"
            onClick={() => setLb(i)}
            style={{ cursor: "zoom-in" }}
          >
            <img src={img} alt={title + " " + (i + 1)} />
          </div>
        ))}
      </div>
    </div>
  );
}
