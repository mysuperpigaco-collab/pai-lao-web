"use client";

import { useState } from "react";
import Lightbox from "@/components/common/ImageLightbox";

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
