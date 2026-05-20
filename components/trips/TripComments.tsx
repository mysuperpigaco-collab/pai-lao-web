"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface ReviewAuthor {
  id: string;
  username: string;
  firstName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

interface ReviewReply {
  id: string;
  text: string;
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
  tripId: string;
  currentUserId?: string | null;
};

function StarRow({ rating }: { rating: number }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 1 }}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

function Avatar({ user, size = 36 }: { user: ReviewAuthor; size?: number }) {
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const initials = (user.displayName || user.firstName).slice(0, 1).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#3b82f6", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0,
      fontSize: size < 30 ? 11 : 14 }}>{initials}</div>
  );
}

export default function TripComments({ reviews, avgRating, tripId, currentUserId }: Props) {
  const { user } = useAuth();
  const isBusiness = user?.role === "BUSINESS";

  // Check if current user already reviewed this trip
  const meId = currentUserId ?? user?.id ?? null;
  const myExistingReview = reviews.find(r => r.author.id === meId) ?? null;
  const [alreadyReviewed, setAlreadyReviewed] = useState(!!myExistingReview);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  // Reply state per review
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, rating: newRating, text: newComment }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalReviews(prev => [{ ...data.review, replies: [] }, ...prev]);
        setNewComment("");
        setNewRating(5);
        setAlreadyReviewed(true);
      } else if (res.status === 409) {
        setAlreadyReviewed(true);
        setSubmitError("คุณได้รีวิวทริปนี้ไปแล้ว · You have already reviewed this trip");
      } else {
        setSubmitError(data.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  };

  const handleReply = async (reviewId: string) => {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    setReplySubmitting(r => ({ ...r, [reviewId]: true }));
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalReviews(prev =>
          prev.map(r => r.id === reviewId
            ? { ...r, replies: [...(r.replies ?? []), data.reply] }
            : r)
        );
        setReplyText(t => ({ ...t, [reviewId]: "" }));
        setReplyOpen(o => ({ ...o, [reviewId]: false }));
      }
    } catch {}
    setReplySubmitting(r => ({ ...r, [reviewId]: false }));
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

      {/* Business accounts cannot review trips */}
      {isBusiness && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          🏢 บัญชีธุรกิจไม่สามารถรีวิวทริปได้ · Business accounts cannot review trips
        </div>
      )}

      {/* Already reviewed notice */}
      {!isBusiness && alreadyReviewed && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          ✅ คุณได้รีวิวทริปนี้แล้ว · You have already reviewed this trip
        </div>
      )}

      {/* Add review form — only if logged in, not business, not already reviewed */}
      {user && !isBusiness && !alreadyReviewed && (
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
            required
            style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 12px",
              fontSize: 14, resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
          {submitError && (
            <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{submitError}</p>
          )}
          <button type="submit" disabled={submitting || !newComment.trim()}
            style={{ marginTop: 10, padding: "8px 20px", borderRadius: 8, border: "none",
              background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer",
              opacity: (!newComment.trim() || submitting) ? 0.6 : 1 }}>
            {submitting ? "⏳ กำลังส่ง..." : "ส่งรีวิว"}
          </button>
        </form>
      )}

      {/* Not logged in prompt */}
      {!user && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#64748b", fontSize: 13, textAlign: "center" }}>
          <a href="/login" style={{ color: "#2563eb", fontWeight: 700 }}>เข้าสู่ระบบ</a> เพื่อเขียนรีวิว · <a href="/login" style={{ color: "#2563eb", fontWeight: 700 }}>Login</a> to write a review
        </div>
      )}

      {/* Review list */}
      {localReviews.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center" }}>ยังไม่มีรีวิว เป็นคนแรกที่รีวิวทริปนี้!</p>
      ) : (
        localReviews.map(review => (
          <div key={review.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
            {/* Review row */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar user={review.author} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{review.author.displayName || review.author.firstName}</div>
                <StarRow rating={review.rating} />
                {review.text && <p style={{ margin: "8px 0 0", color: "#374151", lineHeight: 1.6 }}>{review.text}</p>}
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                  {new Date(review.createdAt).toLocaleDateString("th-TH")}
                </div>

                {/* Reply button — any logged-in user */}
                {user && (
                  <button
                    onClick={() => setReplyOpen(o => ({ ...o, [review.id]: !o[review.id] }))}
                    style={{ marginTop: 8, padding: "4px 12px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    💬 {replyOpen[review.id] ? "ยกเลิก" : "ตอบกลับ"}
                  </button>
                )}
              </div>
            </div>

            {/* Existing replies */}
            {(review.replies ?? []).length > 0 && (
              <div style={{ marginTop: 12, marginLeft: 48, display: "flex", flexDirection: "column", gap: 10 }}>
                {review.replies.map(reply => {
                  const isOwner = reply.author.role === "BUSINESS";
                  return (
                    <div key={reply.id} style={{ background: isOwner ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isOwner ? "#bbf7d0" : "#f1f5f9"}`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10 }}>
                      <Avatar user={reply.author} size={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{reply.author.displayName || reply.author.firstName}</span>
                          {isOwner
                            ? <span style={{ fontSize: 10, fontWeight: 800, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: 999 }}>🏢 เจ้าของ</span>
                            : <span style={{ fontSize: 10, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: 999 }}>💬 ผู้ใช้</span>
                          }
                          <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{new Date(reply.createdAt).toLocaleDateString("th-TH")}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{reply.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reply form */}
            {replyOpen[review.id] && (
              <div style={{ marginTop: 10, marginLeft: 48, display: "flex", gap: 8 }}>
                <textarea
                  value={replyText[review.id] ?? ""}
                  onChange={e => setReplyText(t => ({ ...t, [review.id]: e.target.value }))}
                  placeholder="เขียนความคิดเห็น..."
                  rows={2}
                  style={{ flex: 1, borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "8px 12px", fontSize: 13, resize: "none", fontFamily: "inherit", outline: "none" }}
                />
                <button
                  onClick={() => handleReply(review.id)}
                  disabled={replySubmitting[review.id] || !replyText[review.id]?.trim()}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", opacity: (!replyText[review.id]?.trim()) ? 0.5 : 1 }}>
                  {replySubmitting[review.id] ? "⏳" : "ส่ง"}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
