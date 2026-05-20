"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Props = {
  placeId: string;
  initialLiked?: boolean;
  initialCount?: number;
};

export default function PlaceLikeButton({ placeId, initialLiked = false, initialCount = 0 }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [pop, setPop] = useState(false);

  if (user?.role === "BUSINESS") return null;

  const handleToggle = async () => {
    if (!user) { router.push("/login"); return; }
    setPop(true);
    setTimeout(() => setPop(false), 300);

    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    setLoading(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId }),
      });
      if (res.ok) {
        const d = await res.json();
        setLiked(d.liked);
        setCount(d.count);
      } else {
        setLiked(!next);
        setCount(c => c + (next ? -1 : 1));
      }
    } catch {
      setLiked(!next);
      setCount(c => c + (next ? -1 : 1));
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
        border: liked ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
        background: liked ? "linear-gradient(135deg,#fff1f2,#ffe4e6)" : "white",
        color: liked ? "#ef4444" : "#64748b",
        fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all 0.2s",
        transform: pop ? "scale(1.1)" : "scale(1)",
        boxShadow: liked ? "0 4px 16px rgba(239,68,68,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 20 }}>{liked ? "❤️" : "🤍"}</span>
      <span>{count > 0 ? count.toLocaleString() : ""} ถูกใจ</span>
    </button>
  );
}
