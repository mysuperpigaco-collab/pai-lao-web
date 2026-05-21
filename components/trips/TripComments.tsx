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
  isAnonymous?: boolean;
  author: ReviewAuthor;
  replies: ReviewReply[];
  likes?: number;
}

type Props = {
  reviews: Review[];
  avgRating: number;
  tripId: string;
  currentUserId?: string | null;
  tripAuthorId?: string | null;
};

function StarRow({ rating }: { rating: number }) {
  return <span style={{ color: "#f59e0b", letterSpacing: 1 }}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
}

function Avatar({ user, size = 36 }: { user: ReviewAuthor; size?: number }) {
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const initials = (user.displayName || user.firstName || "?").slice(0, 1).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#3b82f6", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0,
      fontSize: size < 30 ? 11 : 14 }}>{initials}</div>
  );
}

// ── Report Modal ──────────────────────────────────────────
const REPORT_TYPES = [
  { value: "SPAM",          label: "สแปม · Spam" },
  { value: "INAPPROPRIATE", label: "เนื้อหาไม่เหมาะสม · Inappropriate" },
  { value: "FAKE",          label: "ข้อมูลเท็จ · Fake/Misleading" },
  { value: "HARASSMENT",    label: "การคุกคาม · Harassment" },
  { value: "OTHER",         label: "อื่นๆ · Other" },
];

function ReportModal({ targetId, targetType, onClose }: { targetId: string; targetType: string; onClose: () => void }) {
  const [reason, setReason] = useState("SPAM");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType, reason, detail }),
      });
      setDone(true);
    } catch {}
    setSubmitting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>ส่งรายงานแล้ว</h3>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>ขอบคุณที่แจ้งเรา ทีมงานจะตรวจสอบโดยเร็ว</p>
            <button onClick={onClose} style={{ padding: "8px 24px", borderRadius: 10, border: "none", background: "#0f172a", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ปิด</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", margin: 0 }}>🚩 รายงานเนื้อหา · Report</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {REPORT_TYPES.map(rt => (
                <label key={rt.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12,
                  background: reason === rt.value ? "#eff6ff" : "#f8fafc",
                  border: `1.5px solid ${reason === rt.value ? "#bfdbfe" : "#e2e8f0"}`,
                  cursor: "pointer", transition: "all 0.15s" }}>
                  <input type="radio" name="reason" value={rt.value} checked={reason === rt.value} onChange={() => setReason(rt.value)} style={{ accentColor: "#2563eb" }} />
                  <span style={{ fontSize: 13, fontWeight: reason === rt.value ? 700 : 500, color: reason === rt.value ? "#1e40af" : "#374151" }}>{rt.label}</span>
                </label>
              ))}
            </div>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)..."
              rows={3} style={{ width: "100%", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 12px", fontSize: 13, resize: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#e11d48", color: "white", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {submitting ? "⏳ กำลังส่ง..." : "🚩 ส่งรายงาน"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TripComments({ reviews, avgRating, tripId, currentUserId, tripAuthorId }: Props) {
  const { user } = useAuth();
  const isBusiness = user?.role === "BUSINESS";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const meId = currentUserId ?? user?.id ?? null;
  const isOwner = meId != null && meId === tripAuthorId;

  // Check if current user already submitted a rating review
  const myExistingReview = reviews.find(r => r.author.id === meId) ?? null;
  const [alreadyRated, setAlreadyRated] = useState(!!myExistingReview);

  // Review form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  // Reply state per review
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});
  const [likedReviews, setLikedReviews] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("liked_reviews") || "[]")); }
    catch { return new Set(); }
  });

  // Report modal state
  const [reportTarget, setReportTarget] = useState<{ id: string; type: string } | null>(null);

  // Submit new rating+review (first time)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, rating: newRating, text: newComment, isAnonymous }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalReviews(prev => [{ ...data.review, replies: [] }, ...prev]);
        setNewComment("");
        setAlreadyRated(true);
      } else if (res.status === 409) {
        setAlreadyRated(true);
      } else {
        setSubmitError(data.message ?? "เกิดข้อผิดพลาด");
      }
    } catch { setSubmitError("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    setSubmitting(false);
  };

  // Submit text-only comment (after already rated)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // Use reply API on existing review
      const existingId = myExistingReview?.id ?? localReviews.find(r => r.author.id === meId)?.id;
      if (existingId) {
        const res = await fetch(`/api/reviews/${existingId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newComment }),
        });
        if (res.ok) {
          const data = await res.json();
          setLocalReviews(prev => prev.map(r => r.id === existingId
            ? { ...r, replies: [...(r.replies ?? []), data.reply] } : r));
          setNewComment("");
        }
      }
    } catch {}
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
        setLocalReviews(prev => prev.map(r => r.id === reviewId
          ? { ...r, replies: [...(r.replies ?? []), data.reply] } : r));
        setReplyText(t => ({ ...t, [reviewId]: "" }));
        setReplyOpen(o => ({ ...o, [reviewId]: false }));
      }
    } catch {}
    setReplySubmitting(r => ({ ...r, [reviewId]: false }));
  };

  async function handleLike(reviewId: string) {
    if (!user) return;
    const alreadyLiked = likedReviews.has(reviewId);
    const action = alreadyLiked ? "unlike" : "like";
    // Optimistic update
    setLocalReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, likes: Math.max(0, (r.likes ?? 0) + (alreadyLiked ? -1 : 1)) } : r
    ));
    const newSet = new Set(likedReviews);
    if (alreadyLiked) newSet.delete(reviewId); else newSet.add(reviewId);
    setLikedReviews(newSet);
    try { localStorage.setItem("liked_reviews", JSON.stringify([...newSet])); } catch {}
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocalReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: data.likes } : r));
      }
    } catch {}
  }

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: localReviews.filter(r => r.rating === star).length,
  }));

  const canInteract = !!user && !isBusiness && !isAdmin;

  return (
    <div>
      {reportTarget && (
        <ReportModal targetId={reportTarget.id} targetType={reportTarget.type} onClose={() => setReportTarget(null)} />
      )}

      <h2>💬 รีวิวและความคิดเห็น</h2>

      {/* Rating summary */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24, background: "#f8fafc", borderRadius: 12, padding: 16 }}>
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

      {/* Business block */}
      {isAdmin && (
        <div style={{ textAlign:"center", color:"#64748b", fontSize:13, padding:"12px 0" }}>
          🛡️ แอดมินไม่สามารถให้คะแนนหรือรีวิวเนื้อหาได้
        </div>
      )}
      {isBusiness && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#64748b", fontSize: 13 }}>
          🏢 บัญชีธุรกิจไม่สามารถรีวิวทริปได้ · Business accounts cannot review trips
        </div>
      )}

      {/* Owner block */}
      {canInteract && isOwner && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#166534", fontSize: 13 }}>
          🏠 คุณเป็นเจ้าของทริปนี้ ไม่สามารถให้คะแนนทริปของตัวเองได้ · You cannot rate your own trip
        </div>
      )}

      {/* First-time review form: rating + text */}
      {canInteract && !isOwner && !alreadyRated && (
        <form onSubmit={handleSubmitReview} style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 24, border: "1.5px solid #e2e8f0" }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>✍️ เขียนรีวิว · Write a Review</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>คะแนน:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setNewRating(s)}
                style={{ fontSize: 26, background: "none", border: "none", cursor: "pointer", padding: "0 2px",
                  color: s <= newRating ? "#f59e0b" : "#d1d5db", transition: "color 0.15s" }}>★</button>
            ))}
            <span style={{ fontSize: 12, color: "#f59e0b", marginLeft: 4, fontWeight: 700 }}>{newRating}/5</span>
          </div>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)} required
            placeholder="แบ่งปันประสบการณ์ของคุณ..."
            style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 12px",
              fontSize: 14, resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
          {submitError && <p style={{ color: "#dc2626", fontSize: 13, margin: "6px 0 0" }}>{submitError}</p>}
          <button type="submit" disabled={submitting || !newComment.trim()}
            style={{ marginTop: 10, padding: "9px 22px", borderRadius: 8, border: "none",
              background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer",
              opacity: (!newComment.trim() || submitting) ? 0.6 : 1, fontFamily: "inherit" }}>
            {submitting ? "⏳ กำลังส่ง..." : "ส่งรีวิว"}
          </button>
        </form>
      )}

      {/* Already rated — text-only comment box */}
      {canInteract && !isOwner && alreadyRated && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 12, color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            ✅ คุณให้คะแนนทริปนี้แล้ว · Already rated — ยังสามารถเพิ่มความคิดเห็นได้
          </div>
          <form onSubmit={handleSubmitComment} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: "1.5px solid #e2e8f0", display: "flex", gap: 10 }}>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              placeholder="เพิ่มความคิดเห็น..."
              rows={2}
              style={{ flex: 1, borderRadius: 8, border: "1px solid #e2e8f0", padding: "8px 12px", fontSize: 13, resize: "none", fontFamily: "inherit" }} />
            <button type="submit" disabled={submitting || !newComment.trim()}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", opacity: !newComment.trim() ? 0.5 : 1 }}>
              {submitting ? "⏳" : "💬 ส่ง"}
            </button>
          </form>
        </div>
      )}

      {/* Not logged in */}
      {!user && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "#64748b", fontSize: 13, textAlign: "center" }}>
          <a href="/login" style={{ color: "#2563eb", fontWeight: 700 }}>เข้าสู่ระบบ</a> เพื่อเขียนรีวิว · <a href="/login" style={{ color: "#2563eb", fontWeight: 700 }}>Login</a> to write a review
        </div>
      )}

      {/* Review list */}
      {localReviews.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>ยังไม่มีรีวิว เป็นคนแรกที่รีวิวทริปนี้!</p>
      ) : (
        localReviews.map(review => (
          <div key={review.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {review.isAnonymous
                ? <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e2e8f0", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>?</div>
                : <Avatar user={review.author} />}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {review.isAnonymous
                        ? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>ผู้ใช้นิรนาม · Anonymous</span>
                        : (review.author.displayName || review.author.firstName)}
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  {/* Report button */}
                  {user && user.id !== review.author.id && (
                    <button onClick={() => setReportTarget({ id: review.id, type: "REVIEW" })}
                      style={{ padding: "3px 10px", borderRadius: 999, border: "1px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      🚩 รายงาน
                    </button>
                  )}
                </div>
                {review.text && <p style={{ margin: "8px 0 0", color: "#374151", lineHeight: 1.6, fontSize: 14 }}>{review.text}</p>}
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                  {new Date(review.createdAt).toLocaleDateString("th-TH")}
                </div>

                {/* Like + Reply buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleLike(review.id)}
                    disabled={!user || user.role === "ADMIN" || user.role === "SUPERADMIN"}
                    style={{
                      padding: "4px 12px", borderRadius: 999,
                      border: `1px solid ${likedReviews.has(review.id) ? "#fda4af" : "#e2e8f0"}`,
                      background: likedReviews.has(review.id) ? "#fff1f2" : "#f8fafc",
                      color: likedReviews.has(review.id) ? "#e11d48" : "#64748b",
                      fontSize: 12, fontWeight: 700, cursor: user ? "pointer" : "default",
                      fontFamily: "inherit", transition: "all 0.15s",
                      opacity: (!user || user.role === "ADMIN" || user.role === "SUPERADMIN") ? 0.5 : 1,
                    }}>
                    {likedReviews.has(review.id) ? "❤️" : "🤍"} {review.likes ?? 0}
                  </button>
                  {user && (
                    <button
                      onClick={() => setReplyOpen(o => ({ ...o, [review.id]: !o[review.id] }))}
                      style={{ padding: "4px 12px", borderRadius: 999, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      💬 {replyOpen[review.id] ? "ยกเลิก" : "ตอบกลับ"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Existing replies */}
            {(review.replies ?? []).length > 0 && (
              <div style={{ marginTop: 12, marginLeft: 48, display: "flex", flexDirection: "column", gap: 10 }}>
                {review.replies.map(reply => {
                  const isOwnerR = reply.author.role === "BUSINESS";
                  return (
                    <div key={reply.id} style={{ background: isOwnerR ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isOwnerR ? "#bbf7d0" : "#f1f5f9"}`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10 }}>
                      <Avatar user={reply.author} size={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{reply.author.displayName || reply.author.firstName}</span>
                          {isOwnerR
                            ? <span style={{ fontSize: 10, fontWeight: 800, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: 999 }}>🏢 เจ้าของ</span>
                            : <span style={{ fontSize: 10, fontWeight: 800, background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: 999 }}>💬 ผู้ใช้</span>
                          }
                          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(reply.createdAt).toLocaleDateString("th-TH")}</span>
                            {user && user.id !== reply.author.id && (
                              <button onClick={() => setReportTarget({ id: reply.id, type: "REPLY" })}
                                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>🚩</button>
                            )}
                          </div>
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
