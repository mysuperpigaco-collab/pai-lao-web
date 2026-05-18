"use client";

import { useState } from "react";

type Props = {
  initialSaved?: boolean;
  tripSlug: string;
};

export default function BookmarkButton({ initialSaved = false, tripSlug }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    setAnimating(true);
    setSaved((prev) => !prev);
    setTimeout(() => setAnimating(false), 300);
    // TODO: persist to API with tripSlug
    console.log(`Bookmark toggled for: ${tripSlug}`);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={saved ? "ยกเลิกบุ๊คมาร์ค" : "บุ๊คมาร์คเรื่องนี้"}
      aria-pressed={saved}
      className={`bm-btn ${saved ? "bm-saved" : ""} ${animating ? "bm-pop" : ""}`}
    >
      <span className="bm-icon">{saved ? "🔖" : "🏷️"}</span>
      <span className="bm-label">{saved ? "บุ๊คมาร์คแล้ว" : "บุ๊คมาร์ค"}</span>

      <style jsx>{`
        .bm-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .bm-btn:hover:not(.bm-saved) {
          border-color: #bfdbfe;
          color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 4px 16px rgba(59,130,246,0.12);
        }
        .bm-saved {
          border-color: #2563eb;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
          box-shadow: 0 4px 16px rgba(59,130,246,0.18);
        }
        .bm-saved:hover {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }
        .bm-pop {
          transform: scale(1.12);
        }
        .bm-icon { font-size: 16px; }
      `}</style>
    </button>
  );
}
