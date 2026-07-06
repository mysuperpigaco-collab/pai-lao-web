"use client";

import { useState } from "react";
import ImageLightbox from "@/components/common/ImageLightbox";
import { sanitizeRichHtml } from "@/lib/sanitize";

interface Props {
  html: string;
}

export default function TripRichContent({ html }: Props) {
  const [lightbox, setLightbox] = useState<{ imgs: string[]; idx: number } | null>(null);
  const safeHtml = sanitizeRichHtml(html);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      // เก็บทุกรูปในเนื้อหา → เปิด lightbox แล้วปัดดูรูปถัดไปได้เลย
      const imgs = Array.from(e.currentTarget.querySelectorAll("img")).map(im => im.src);
      const idx = Math.max(0, imgs.indexOf((target as HTMLImageElement).src));
      setLightbox({ imgs, idx });
    }
  };

  return (
    <>
      <div
        className="trip-rich-content"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
        onClick={handleClick}
      />
      {lightbox && (
        <ImageLightbox
          images={lightbox.imgs}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
