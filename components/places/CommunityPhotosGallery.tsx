"use client";

import { useState } from "react";
import ImageLightbox from "@/components/common/ImageLightbox";

interface Props {
  images: string[];
}

export default function CommunityPhotosGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="pd-gallery">
        {images.slice(0, 9).map((img, i) => (
          <div
            key={i}
            className="pd-gal-item"
            onClick={() => setLightbox(i)}
            style={{ cursor: "zoom-in" }}
          >
            <img src={img} alt={"Community photo " + (i + 1)} />
          </div>
        ))}
      </div>
      {images.length > 9 && (
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
          +{images.length - 9} รูปเพิ่มเติม
        </p>
      )}
      {lightbox !== null && (
        <ImageLightbox
          src={images[lightbox]}
          alt={"Community photo " + (lightbox + 1)}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
