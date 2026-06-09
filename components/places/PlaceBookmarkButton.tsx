"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { tryFireConfetti } from "@/lib/confetti";

type Props = {
  placeId: string;
  initialSaved?: boolean;
};

export default function PlaceBookmarkButton({ placeId, initialSaved = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => { setSaved(initialSaved); }, [initialSaved]);

  const handleToggle = async () => {
    if (!user) { router.push("/login"); return; }
    setPop(true);
    setTimeout(() => setPop(false), 300);

    const next = !saved;
    setSaved(next);
    setLoading(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (res.ok) {
        const d = await res.json();
        setSaved(d.bookmarked);
        if (d.bookmarked) tryFireConfetti(`pl_bm_place_${placeId}`, ["#3b82f6","#6366f1","#a78bfa","#4facfe"]);
      } else {
        setSaved(!next);
      }
    } catch {
      setSaved(!next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        flex: 1, padding: "12px 8px", borderRadius: 14,
        border: saved ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
        background: saved ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "white",
        color: saved ? "#2563eb" : "#64748b",
        fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all 0.2s",
        transform: pop ? "scale(1.1)" : "scale(1)",
        boxShadow: saved ? "0 4px 16px rgba(37,99,235,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 20 }}>{saved ? "🔖" : "🏷️"}</span>
      <span>{saved ? "บันทึกแล้ว" : "บันทึก"}</span>
    </button>
  );
}
