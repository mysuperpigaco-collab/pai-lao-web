"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type Props = {
  targetUserId: string;
  initialFollowing?: boolean;
  initialCount?: number;
};

export default function FollowButton({ targetUserId, initialFollowing = false, initialCount = 0 }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Don't render if viewing own profile
  if (user?.id === targetUserId) return null;

  const handleToggle = async () => {
    if (!user) { router.push("/login"); return; }

    const optimistic = !following;
    setFollowing(optimistic);
    setCount(c => c + (optimistic ? 1 : -1));
    setLoading(true);

    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        setCount(data.followerCount);
      } else {
        setFollowing(!optimistic);
        setCount(c => c + (optimistic ? -1 : 1));
      }
    } catch {
      setFollowing(!optimistic);
      setCount(c => c + (optimistic ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "9px 20px",
        borderRadius: "999px",
        border: following ? "1.5px solid #10b981" : "1.5px solid #d1fae5",
        background: following
          ? "linear-gradient(135deg, #10b981, #06b6d4)"
          : "linear-gradient(135deg, #f0fdf4, #ecfeff)",
        color: following ? "#fff" : "#059669",
        fontWeight: 800, fontSize: 13,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s",
        boxShadow: following ? "0 4px 16px rgba(16,185,129,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
        whiteSpace: "nowrap",
      }}
    >
      {following ? "✓ ติดตามแล้ว" : "➕ ติดตาม"}
      {count > 0 && <span style={{ opacity: 0.8, fontWeight: 600 }}>· {count}</span>}
    </button>
  );
}
