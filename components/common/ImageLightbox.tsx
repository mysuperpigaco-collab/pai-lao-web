"use client";

import { useEffect } from "react";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, cursor: "zoom-out",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.15)", border: "none",
          borderRadius: "50%", width: 40, height: 40,
          color: "white", fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>
      <img
        src={src} alt={alt ?? ""}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "88vh",
          borderRadius: 16, objectFit: "contain",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          cursor: "default",
        }}
      />
    </div>
  );
}
