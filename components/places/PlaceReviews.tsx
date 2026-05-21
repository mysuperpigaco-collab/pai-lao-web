"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface ReviewAuthor {
  id: string; username: string; firstName: string;
  displayName?: string | null; avatarUrl?: string | null; role?: string;
}
interface ReviewReply {
  id: string; text: string; createdAt: string; author: ReviewAuthor;
}
interface Review {
  id: string; rating: number; text: string; createdAt: string;
  isAnonymous?: boolean;
  author: ReviewAuthor; replies: ReviewReply[]; likes?: number;
}
type Props = {
  placeId: string;
  businessOwnerId?: string | null;
  initialReviews: Review[];
  avgRating: number;
  currentUserId?: string | null;
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}
function Avatar({ user, size = 36 }: { user: ReviewAuthor; size?: number }) {
  const name = user.displayName || user.firstName || "?";
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
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
      await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, targetType, reason, detail }) });
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
                <label key={rt.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: reason === rt.value ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${reason === rt.value ? "#bfdbfe" : "#e2e8f0"}`, cursor: "pointer" }}>
                  <input type="radio" name="reason" value={rt.value} checked={reason === rt.value} onChange={() => setReason(rt.value)} style={{ accentColor: "#2563eb" }} />
                  <span style={{ fontSize: 13, fontWeight: reason === rt.value ? 700 : 500, color: reason === rt.value ? "#1e40af" : "#374151" }}>{rt.label}</span>
                </label>
              ))}
            </div>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." rows={3} style={{ width: "100%", borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "10px 12px", fontSize: 13, resize: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }} />
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

export default function PlaceReviews({ placeId, businessOwnerId, initialReviews, avgRating, currentUserId }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reply state
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});
  const [likedReviews, setLikedReviews] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("liked_reviews") || "[]")); }
    catch { return new Set(); }
  });

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: string } | null>(null);

  async function handleLike(reviewId: string) {
    if (!user || user.role === "ADMIN" || user.role === "SUPERADMIN") return;
    const alreadyLiked = likedReviews.has(reviewId);
    const action = alreadyLiked ? "unlike" : "like";
    setReviews(prev => prev.map(r =>
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
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: data.likes } : r));
      }
    } catch {}
  }

  const isBusiness = user?.role === "BUSINESS";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const isOwner = isBusiness && (user?.id === businessOwnerId);

  // Check if already reviewed
  const meId = currentUserId ?? user?.id ?? null;
  const myExistingReview = reviews.find(r => r.author.id === meId) ?? null;
  const [alreadyRated, setAlreadyRated] = useState(!!myExistingReview);

  const canInteract = !!user && !isBusiness && !isAdmin;

  const currentAvg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : avgRating;

  // ── Submit first-time review (rating + text) ──
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, rating: newRating, text: newText, isAnonymous }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [{ ...data.review, replies: [] }, ...prev]);
        setNewText(""); setNewRating(5);
        setAlreadyRated(true);
      } else if (res.status === 409) {
        setAlreadyRated(true);
      } else {
        setSubmitError(data.message ?? "เกิดข้อผิดพลาด");
      }
    } catch { setSubmitError("เกิดข้อผิดพลาด"); }
    setSubmitting(false);
  };

  // ── Submit text-only comment (after already rated) ──
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      const existingId = myExistingReview?.id ?? reviews.find(r => r.author.id === meId)?.id;
      if (existingId) {
        const res = await fetch(`/api/reviews/${existingId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newText }),
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(prev => prev.map(r => r.id === existingId ? { ...r, replies: [...(r.replies ?? []), data.reply] } : r));
          setNewText("");
        }
      }
    } catch {}
    setSubmitting(false);
  };

  // ── Reply ──
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
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, replies: [...(r.replies ?? []), data.reply] } : r));
        setReplyText(t => ({ ...t, [reviewId]: "" }));
        setReplyOpen(o => ({ ...o, [reviewId]: false }));
      }
    } catch {}
    setReplySubmitting(r => ({ ...r, [reviewId]: false }));
  };

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <div>
      {reportTarget && <ReportModal targetId={reportTarget.id} targetType={reportTarget.type} onClose={() => setReportTarget(null)} />}

      {/* ── Rating summary ── */}
      {reviews.length > 0 && (
        <div className="pr-summary">
          <div className="pr-score">
            <div className="pr-big-num">{currentAvg.toFixed(1)}</div>
            <Stars rating={Math.round(currentAvg)} size={18} />
            <div className="pr-count">{reviews.length} รีวิว · reviews</div>
          </div>
          <div className="pr-bars">
            {ratingBreakdown.map(({ star, count }) => (
              <div key={star} className="pr-bar-row">
                <span className="pr-bar-label">{star} ★</span>
                <div className="pr-bar-track"><div className="pr-bar-fill" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }} /></div>
                <span className="pr-bar-num">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notices ── */}
      {isAdmin && (
        <div style={{ textAlign:"center", color:"#64748b", fontSize:13, padding:"12px 0" }}>
          🛡️ แอดมินไม่สามารถให้คะแนนหรือรีวิวเนื้อหาได้
        </div>
      )}
      {isBusiness && !isOwner && (
        <div className="pr-notice">🏢 บัญชีธุรกิจไม่สามารถรีวิวสถานที่ได้ · Business accounts cannot leave reviews</div>
      )}
      {isOwner && (
        <div className="pr-owner-notice">🏢 คุณเป็นเจ้าของสถานที่นี้ · You own this place — you can reply to reviews below</div>
      )}
      {!user && (
        <div className="pr-notice"><span>เข้าสู่ระบบเพื่อรีวิว · </span><a href="/login" style={{ color: "#2563eb", fontWeight: 700 }}>Login to review</a></div>
      )}

      {/* ── First-time review form (rating + text) ── */}
      {canInteract && !alreadyRated && (
        <form onSubmit={handleReview} className="pr-form">
          <div className="pr-form-title">✍️ เขียนรีวิว · Write a review</div>
          <div className="pr-stars-row">
            <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>คะแนน:</span>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button" onClick={() => setNewRating(s)}
                className="pr-star-btn" style={{ color: s <= newRating ? "#f59e0b" : "#d1d5db" }}>★</button>
            ))}
            <span className="pr-star-hint">{newRating}/5</span>
          </div>
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="แบ่งปันประสบการณ์ของคุณ... Share your experience..."
            className="pr-textarea" required />
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569", userSelect: "none", margin: "8px 0 4px" }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
              style={{ accentColor: "#64748b", width: 15, height: 15 }} />
            <span>ไม่แสดงชื่อ · Post anonymously</span>
          </label>
          {submitError && <p style={{ color: "#dc2626", fontSize: 13, margin: "6px 0 0" }}>{submitError}</p>}
          <button type="submit" disabled={submitting || !newText.trim()} className="pr-submit-btn">
            {submitting ? "⏳ กำลังส่ง..." : "📤 ส่งรีวิว · Submit"}
          </button>
        </form>
      )}

      {/* ── Already rated — text-only comment ── */}
      {canInteract && alreadyRated && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 16px", marginBottom: 10, color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            ✅ คุณให้คะแนนสถานที่นี้แล้ว · Already rated — ยังสามารถเพิ่มความคิดเห็นได้
          </div>
          <form onSubmit={handleComment} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: "1.5px solid #e2e8f0", display: "flex", gap: 10 }}>
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              placeholder="เพิ่มความคิดเห็น..." rows={2}
              style={{ flex: 1, borderRadius: 8, border: "1px solid #e2e8f0", padding: "8px 12px", fontSize: 13, resize: "none", fontFamily: "inherit" }} />
            <button type="submit" disabled={submitting || !newText.trim()}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", opacity: !newText.trim() ? 0.5 : 1 }}>
              {submitting ? "⏳" : "💬 ส่ง"}
            </button>
          </form>
        </div>
      )}

      {/* ── Review list ── */}
      {reviews.length === 0 ? (
        <div className="pr-empty">
          <div style={{ fontSize: 40 }}>💬</div>
          <p>ยังไม่มีรีวิว · No reviews yet</p>
          <small>เป็นคนแรกที่รีวิวสถานที่นี้! Be the first to review!</small>
        </div>
      ) : (
        <div className="pr-list">
          {reviews.map(review => (
            <div key={review.id} className="pr-review">
              <div className="pr-review-head">
                {review.isAnonymous
                  ? <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e2e8f0", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>?</div>
                  : <Avatar user={review.author} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div className="pr-reviewer-name">
                        {review.isAnonymous
                          ? <span style={{ color: "#94a3b8", fontStyle: "italic" }}>ผู้ใช้นิรนาม · Anonymous</span>
                          : (review.author.displayName || review.author.firstName)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Stars rating={review.rating} size={13} />
                        <span className="pr-date">{new Date(review.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                    {/* Report button */}
                    {user && user.id !== review.author.id && (
                      <button onClick={() => setReportTarget({ id: review.id, type: "REVIEW" })}
                        style={{ padding: "3px 10px", borderRadius: 999, border: "1px solid #fee2e2", background: "#fff5f5", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                        🚩 รายงาน
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="pr-review-text">{review.text}</p>

              {/* Replies */}
              {review.replies?.length > 0 && (
                <div className="pr-replies">
                  {review.replies.map(reply => {
                    const isReplyOwner = (reply.author as any).role === "BUSINESS";
                    return (
                      <div key={reply.id} className="pr-reply">
                        <div className="pr-reply-head">
                          <Avatar user={reply.author} size={28} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="pr-reply-name">{reply.author.displayName || reply.author.firstName}</span>
                              {isReplyOwner ? <span className="pr-owner-badge">🏢 เจ้าของ</span> : <span className="pr-user-badge">💬 ผู้ใช้</span>}
                              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="pr-date">{new Date(reply.createdAt).toLocaleDateString("th-TH")}</span>
                                {user && user.id !== reply.author.id && (
                                  <button onClick={() => setReportTarget({ id: reply.id, type: "REPLY" })}
                                    style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer", padding: "0 2px", fontFamily: "inherit" }}>🚩</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="pr-reply-text">{reply.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Like + Reply zone */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => handleLike(review.id)}
                  disabled={!user || isAdmin || isBusiness}
                  style={{
                    padding: "4px 12px", borderRadius: 999,
                    border: `1px solid ${likedReviews.has(review.id) ? "#fda4af" : "#e2e8f0"}`,
                    background: likedReviews.has(review.id) ? "#fff1f2" : "#f8fafc",
                    color: likedReviews.has(review.id) ? "#e11d48" : "#64748b",
                    fontSize: 12, fontWeight: 700,
                    cursor: (user && !isAdmin && !isBusiness) ? "pointer" : "default",
                    fontFamily: "inherit", transition: "all 0.15s",
                    opacity: (!user || isAdmin || isBusiness) ? 0.5 : 1,
                  }}>
                  {likedReviews.has(review.id) ? "❤️" : "🤍"} {review.likes ?? 0}
                </button>
                {user && (
                  <div className="pr-reply-zone" style={{ flex: 1 }}>
                    {replyOpen[review.id] ? (
                      <div className="pr-reply-form">
                        <textarea value={replyText[review.id] ?? ""} onChange={e => setReplyText(t => ({ ...t, [review.id]: e.target.value }))}
                          placeholder={isOwner ? "ตอบกลับในฐานะเจ้าของสถานที่..." : "ตอบกลับความคิดเห็น..."} className="pr-reply-textarea" />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button onClick={() => handleReply(review.id)} disabled={replySubmitting[review.id] || !replyText[review.id]?.trim()} className="pr-reply-submit">
                            {replySubmitting[review.id] ? "⏳" : isOwner ? "🏢 ตอบกลับ" : "💬 ตอบกลับ"}
                          </button>
                          <button onClick={() => setReplyOpen(o => ({ ...o, [review.id]: false }))} className="pr-reply-cancel">ยกเลิก</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReplyOpen(o => ({ ...o, [review.id]: true }))} className="pr-reply-open-btn">
                        {isOwner ? "🏢 ตอบกลับในฐานะเจ้าของ" : "💬 ตอบกลับ · Reply"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .pr-summary { display: flex; gap: 24px; align-items: center; padding: 20px 24px; background: #f8fafc; border-radius: 16px; margin-bottom: 22px; border: 1px solid #f1f5f9; }
        .pr-score { text-align: center; min-width: 80px; }
        .pr-big-num { font-size: 42px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 4px; }
        .pr-count { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .pr-bars { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .pr-bar-row { display: flex; align-items: center; gap: 8px; }
        .pr-bar-label { font-size: 12px; color: #64748b; width: 28px; text-align: right; }
        .pr-bar-track { flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .pr-bar-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 999px; transition: width 0.4s; }
        .pr-bar-num { font-size: 12px; color: #94a3b8; width: 18px; }
        .pr-notice { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 13px 18px; margin-bottom: 20px; font-size: 13px; color: #64748b; }
        .pr-owner-notice { background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 13px 18px; margin-bottom: 20px; font-size: 13px; color: #065f46; font-weight: 600; }
        .pr-form { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 26px; }
        .pr-form-title { font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
        .pr-stars-row { display: flex; align-items: center; gap: 2px; margin-bottom: 12px; }
        .pr-star-btn { font-size: 28px; background: none; border: none; cursor: pointer; transition: transform 0.1s; padding: 0 2px; }
        .pr-star-btn:hover { transform: scale(1.2); }
        .pr-star-hint { font-size: 13px; color: #64748b; margin-left: 6px; font-weight: 700; }
        .pr-textarea { width: 100%; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 12px 14px; font-size: 14px; resize: vertical; min-height: 90px; box-sizing: border-box; font-family: inherit; background: white; color: #0f172a; }
        .pr-textarea:focus { outline: none; border-color: #4facfe; }
        .pr-submit-btn { margin-top: 10px; padding: 10px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; font-family: inherit; }
        .pr-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pr-empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
        .pr-empty p { font-size: 15px; font-weight: 600; margin: 8px 0 4px; color: #475569; }
        .pr-empty small { font-size: 12px; }
        .pr-list { display: flex; flex-direction: column; gap: 0; }
        .pr-review { padding: 20px 0; border-bottom: 1px solid #f1f5f9; }
        .pr-review:last-child { border-bottom: none; }
        .pr-review-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
        .pr-reviewer-name { font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 3px; }
        .pr-date { font-size: 11px; color: #94a3b8; }
        .pr-review-text { font-size: 14px; color: #374151; line-height: 1.7; margin: 0 0 0 48px; }
        .pr-replies { margin: 12px 0 0 48px; display: flex; flex-direction: column; gap: 10px; }
        .pr-reply { background: #f0fdf4; border-left: 3px solid #10b981; border-radius: 0 12px 12px 0; padding: 12px 14px; }
        .pr-reply-head { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 6px; }
        .pr-reply-name { font-size: 13px; font-weight: 800; color: #065f46; }
        .pr-owner-badge { background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid #a7f3d0; }
        .pr-user-badge { background: #eff6ff; color: #2563eb; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid #bfdbfe; }
        .pr-reply-text { font-size: 13px; color: #374151; margin: 0 0 0 38px; line-height: 1.6; }
        .pr-reply-zone { margin: 10px 0 0 48px; }
        .pr-reply-open-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; border: 1.5px solid #a7f3d0; background: #f0fdf4; color: #059669; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; font-family: inherit; }
        .pr-reply-open-btn:hover { background: #dcfce7; border-color: #6ee7b7; }
        .pr-reply-form { display: flex; flex-direction: column; }
        .pr-reply-textarea { border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 10px 12px; font-size: 13px; resize: vertical; min-height: 70px; font-family: inherit; background: #f0fdf4; color: #065f46; }
        .pr-reply-textarea:focus { outline: none; border-color: #10b981; }
        .pr-reply-submit { padding: 8px 16px; border-radius: 10px; border: none; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; font-weight: 800; font-size: 12px; cursor: pointer; font-family: inherit; }
        .pr-reply-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .pr-reply-cancel { padding: 8px 16px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: white; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
      `}</style>
    </div>
  );
}
