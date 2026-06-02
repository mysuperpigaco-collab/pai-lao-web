"use client";

import { useState, useRef, useEffect } from "react";
import ImageLightbox from "@/components/common/ImageLightbox";

interface Props {
  html: string;
}

export default function TripRichContent({ html }: Props) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const imgs = ref.current.querySelectorAll<HTMLImageElement>("img");
    const handlers: Array<() => void> = [];
    imgs.forEach(img => {
      const fn = () => setLightbox({ src: img.src, alt: img.alt });
      img.addEventListener("click", fn);
      img.style.cursor = "zoom-in";
      handlers.push(() => img.removeEventListener("click", fn));
    });
    return () => handlers.forEach(h => h());
  }, [html]);

  return (
    <>
      <div
        ref={ref}
        className="trip-rich-content"
        dangerouslySetInnerHTML={{ __html: html }}
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
