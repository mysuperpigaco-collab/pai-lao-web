"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { tryFireConfetti } from "@/lib/confetti";

type Props = {
  tripId: string;
  initialSaved?: boolean;
};

export default function BookmarkButton({ tripId, initialSaved = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync when server-supplied initialSaved changes (e.g. after login)
  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);

  const handleToggle = async () => {
    if (!user) { router.push("/login"); return; }
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    const optimistic = !saved;
    setSaved(optimistic);
    setLoading(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      if (!res.ok) {
        // Revert on failure
        setSaved(!optimistic);
      } else {
        const data = await res.json();
        setSaved(data.bookmarked);
        if (data.bookmarked) tryFireConfetti(`pl_bm_${tripId}`, ["#3b82f6","#6366f1","#a78bfa","#4facfe"]);
      }
    } catch {
      setSaved(!optimistic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? "ยกเลิกบุ๊คมาร์ค" : "บุ๊คมาร์คเรื่องนี้"}
      aria-pressed={saved}
      className={`bm-btn ${saved ? "bm-saved" : ""} ${animating ? "bm-pop" : ""}`}
    >
      <span className="bm-icon">{saved ? "🔖" : "🏷️"}</span>
      <span className="bm-label">{loading ? "..." : saved ? "บุ๊คมาร์คแล้ว" : "บุ๊คมาร์ค"}</span>

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
        .bm-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .bm-btn:hover:not(.bm-saved):not(:disabled) {
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
        .bm-saved:hover:not(:disabled) {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }
        .bm-pop { transform: scale(1.12); }
        .bm-icon { font-size: 16px; }
      `}</style>
    </button>
  );
}
