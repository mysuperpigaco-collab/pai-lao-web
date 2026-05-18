"use client";
import { useState } from "react";

interface ReviewAuthor {
  id: string;
  username: string;
  firstName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface ReviewReply {
  id: string;
  content: string;
  createdAt: string;
  author: ReviewAuthor;
}

interface Review {
  id: string;
  rating: number;
  text?: string | null;
  createdAt: string;
  author: ReviewAuthor;
  replies: ReviewReply[];
}

type Props = {
  reviews: Review[];
  avgRating: number;
  tripSlug: string;
};

function StarRow({ rating }: { rating: number }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 1 }}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

function Avatar({ user }: { user: ReviewAuthor }) {
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />;
  const initials = (user.displayName || user.firstName).slice(0, 1).toUpperCase();
  return <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials}</div>;
}

export default function TripComments({ reviews, avgRating, tripSlug }: Props) {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripSlug, rating: newRating, text: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalReviews(prev => [data.review, ...prev]);
        setNewComment("");
        setNewRating(5);
      }
    } catch {}
    setSubmitting(false);
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: localReviews.filter(r => r.rating === star).length,
  }));

  return (
    <div>
      <h2>💬 รีวิวและความคิดเห็น</h2>

      {/* Rating summary */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24,
        background: "#f8fafc", borderRadius: 12, padding: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#1e293b" }}>{avgRating.toFixed(1)}</div>
          <StarRow rating={Math.round(avgRating)} />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{localReviews.length} รีวิว</div>
        </div>
        <div style={{ flex: 1 }}>
          {ratingBreakdown.map(({ star, count }) => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, width: 16 }}>{star}</span>
              <span style={{ color: "#f59e0b", fontSize: 12 }}>★</span>
              <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                <div style={{ height: "100%", borderRadius: 3, background: "#f59e0b",
                  width: localReviews.length ? `${(count / localReviews.length) * 100}%` : "0%" }} />
              </div>
              <span style={{ fontSize: 12, color: "#64748b", width: 20 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add review form */}
      <form onSubmit={handleSubmit} style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>✍️ เขียนรีวิว</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" onClick={() => setNewRating(s)}
              style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer",
                color: s <= newRating ? "#f59e0b" : "#d1d5db" }}>★</button>
          ))}
        </div>
        <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
          placeholder="แบ่งปันประสบการณ์ของคุณ..."
          style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 12px",
            fontSize: 14, resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
        <button type="submit" disabled={submitting}
          style={{ marginTop: 10, padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer" }}>
          {submitting ? "⏳ กำลังส่ง..." : "ส่งรีวิว"}
        </button>
      </form>

      {/* Review list */}
      {localReviews.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center" }}>ยังไม่มีรีวิว เป็นคนแรกที่รีวิวทริปนี้!</p>
      ) : (
        localReviews.map(review => (
          <div key={review.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar user={review.author} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{review.author.displayName || review.author.firstName}</div>
                <StarRow rating={review.rating} />
                {review.text && <p style={{ margin: "8px 0 0", color: "#374151", lineHeight: 1.6 }}>{review.text}</p>}
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                  {new Date(review.createdAt).toLocaleDateString("th-TH")}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
