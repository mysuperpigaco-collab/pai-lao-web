"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Props = {
  tripId: string;
  initialLiked?: boolean;
  initialCount?: number;
  tripAuthorId?: string | null;
};

export default function LikeButton({ tripId, initialLiked = false, initialCount = 0, tripAuthorId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Business accounts cannot like content
  if (user?.role === "BUSINESS") return null;

  // Owner cannot like their own trip
  const isOwner = !!user && !!tripAuthorId && user.id === tripAuthorId;
  if (isOwner) {
    return (
      <button disabled style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 18px", borderRadius: "999px",
        border: "1.5px solid #e2e8f0", background: "#f8fafc",
        color: "#cbd5e1", fontWeight: 800, fontSize: 13,
        cursor: "not-allowed", opacity: 0.7,
      }}>
        <span style={{ fontSize: 16 }}>🤍</span>
        <span>{count > 0 ? count : ""} ถูกใจ</span>
      </button>
    );
  }

  const handleToggle = async () => {
    if (!user) { router.push("/login"); return; }
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    const optimistic = !liked;
    setLiked(optimistic);
    setCount(c => c + (optimistic ? 1 : -1));
    setLoading(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.count);
      } else {
        setLiked(!optimistic);
        setCount(c => c + (optimistic ? -1 : 1));
      }
    } catch {
      setLiked(!optimistic);
      setCount(c => c + (optimistic ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? "เลิกถูกใจ" : "ถูกใจ"}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 18px", borderRadius: "999px",
        border: liked ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
        background: liked ? "linear-gradient(135deg, #fff1f2, #ffe4e6)" : "white",
        color: liked ? "#ef4444" : "#64748b",
        fontWeight: 800, fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all 0.2s",
        boxShadow: liked ? "0 4px 16px rgba(239,68,68,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
        transform: animating ? "scale(1.12)" : "scale(1)",
      }}
    >
      <span style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span>
      <span>{count > 0 ? count : ""} ถูกใจ</span>
    </button>
  );
}
