"use client";

import { useState } from "react";
import ImageLightbox from "@/components/common/ImageLightbox";

interface Props {
  html: string;
}

export default function TripRichContent({ html }: Props) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      setLightbox({ src: img.src, alt: img.alt });
    }
  };

  return (
    <>
      <div
        className="trip-rich-content"
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
