"use client";

import { useState } from "react";

// ── รูปที่มี LQIP placeholder (เบลอทันที → คมชัดตอนโหลดเสร็จ) ──
// blur = data-URI จิ๋วจาก DB (coverBlur) · ถ้าไม่มี blur → พฤติกรรมเหมือน <img> เดิม
// ครอบด้วย wrapper ที่เต็มพื้นที่ parent (parent ควร position:relative + overflow:hidden)

type Props = {
  src: string;
  alt?: string;
  blur?: string | null;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  onClick?: () => void;
  draggable?: boolean;
};

export default function BlurImage({ src, alt = "", blur, className, style, loading = "lazy", onClick, draggable }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span style={{ position: "absolute", inset: 0, display: "block", overflow: "hidden" }}>
      {blur && !loaded && (
        <img
          src={blur}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", transform: "scale(1.06)", filter: "blur(12px)",
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        draggable={draggable}
        onClick={onClick}
        onLoad={() => setLoaded(true)}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: loaded || !blur ? 1 : 0,
          transition: "opacity 0.45s ease",
          ...style,
        }}
      />
    </span>
  );
}
