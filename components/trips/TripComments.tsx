"use client";

import { useState } from "react";
import type { TripComment } from "@/data/mockTrips";

type Props = {
  comments: TripComment[];
  ratingCount: number;
  ratingBreakdown: number[];
  overallRating: number;
};

const COLOR_MAP: Record<string, { bg: string; color: string }> = {
  blue:  { bg: "#eff6ff", color: "#2563eb" },
  green: { bg: "#ecfdf5", color: "#059669" },
  amber: { bg: "#fffbeb", color: "#d97706" },
  pink:  { bg: "#fdf2f8", color: "#9d174d" },
  teal:  { bg: "#f0fdfa", color: "#0f766e" },
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

export default function TripComments({
  comments: initialComments,
  ratingCount,
  ratingBreakdown,
  overallRating,
}: Props) {
  const [comments, setComments] = useState<TripComment[]>(initialComments);
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [likeStates, setLikeStates] = useState<Record<string, boolean>>({});
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const displayStars = hoverStars || selectedStars;

  const handleSubmitReview = () => {
    if (!reviewText.trim() || !selectedStars) return;
    const newComment: TripComment = {
      id: `new-${Date.now()}`,
      author: "คุณ (ฉัน)",
      authorInitials: "ฉ",
      authorColor: "blue",
      rating: selectedStars,
      text: reviewText.trim(),
      timeAgo: "เพิ่งเขียน",
      likes: 0,
      replies: [],
    };
    setComments([newComment, ...comments]);
    setReviewText("");
    setSelectedStars(0);
  };

  const toggleLike = (commentId: string) => {
    setLikeStates((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const sendReply = (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                { id: `r-${Date.now()}`, author: "คุณ (ฉัน)", authorInitials: "ฉ", text, timeAgo: "เพิ่งตอบ" },
              ],
            }
          : c
      )
    );
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
  };

  const maxBar = Math.max(...ratingBreakdown, 1);

  return (
    <div className="cmt-section">

      {/* ─── RATING OVERVIEW ─── */}
      <div className="rating-overview">
        <div className="rating-big-score">
          <div className="rating-number">{overallRating.toFixed(1)}</div>
          <StarRow rating={Math.round(overallRating)} size={20} />
          <div className="rating-count">จาก {ratingCount} รีวิว</div>
        </div>
        <div className="rating-bars">
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div className="bar-row" key={star}>
              <span className="bar-label">{star} ★</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(ratingBreakdown[5 - star] / maxBar) * 100}%` }}
                />
              </div>
              <span className="bar-count">{ratingBreakdown[5 - star]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── WRITE REVIEW ─── */}
      <div className="write-review">
        <div className="write-review-title">✏️ เขียนรีวิวของคุณ</div>

        {/* Star picker */}
        <div className="star-picker">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              className="star-btn"
              onMouseEnter={() => setHoverStars(s)}
              onMouseLeave={() => setHoverStars(0)}
              onClick={() => setSelectedStars(s)}
              aria-label={`${s} ดาว`}
            >
              {s <= displayStars ? "★" : "☆"}
            </button>
          ))}
          {selectedStars > 0 && (
            <span className="star-label">
              {["", "แย่มาก", "พอไหว", "ปานกลาง", "ดีมาก", "ยอดเยี่ยม!"][selectedStars]}
            </span>
          )}
        </div>

        <textarea
          className="review-textarea"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="แชร์ประสบการณ์ของคุณ... บอกเล่าความประทับใจหรือเคล็ดลับที่อยากแนะนำ"
          rows={3}
        />
        <div className="review-submit-row">
          <button
            className="review-submit-btn"
            onClick={handleSubmitReview}
            disabled={!reviewText.trim() || !selectedStars}
          >
            📤 ส่งรีวิว
          </button>
        </div>
      </div>

      {/* ─── COMMENT LIST ─── */}
      <div className="cmt-list-header">
        💬 ความคิดเห็น
        <span className="cmt-count">{comments.length} รายการ</span>
      </div>

      <div className="cmt-list">
        {comments.map((c) => {
          const colors = COLOR_MAP[c.authorColor] ?? COLOR_MAP.blue;
          const liked = likeStates[c.id] ?? false;
          const replyOpen = openReplyId === c.id;

          return (
            <div className="cmt-item" key={c.id}>
              {/* Header */}
              <div className="cmt-hdr">
                <div
                  className="cmt-avatar"
                  style={{ background: colors.bg, color: colors.color }}
                >
                  {c.authorInitials}
                </div>
                <div className="cmt-meta">
                  <div className="cmt-name">
                    {c.author}
                    <StarRow rating={c.rating} size={12} />
                  </div>
                  <div className="cmt-time">{c.timeAgo}</div>
                </div>
              </div>

              {/* Text */}
              <p className="cmt-text">{c.text}</p>

              {/* Actions */}
              <div className="cmt-actions">
                <button
                  className={`cmt-act-btn ${liked ? "cmt-liked" : ""}`}
                  onClick={() => toggleLike(c.id)}
                  aria-label="ถูกใจ"
                >
                  {liked ? "❤️" : "🤍"}{" "}
                  {c.likes + (liked ? 1 : 0)}
                </button>
                <button
                  className="cmt-act-btn"
                  onClick={() => setOpenReplyId(replyOpen ? null : c.id)}
                >
                  💬 ตอบกลับ
                </button>
              </div>

              {/* Replies */}
              {(c.replies.length > 0 || replyOpen) && (
                <div className="replies-wrap">
                  {c.replies.map((r) => (
                    <div className="reply-item" key={r.id}>
                      <div className="reply-avatar">{r.authorInitials}</div>
                      <div className="reply-body">
                        <div className="reply-name">{r.author}</div>
                        <div className="reply-text">{r.text}</div>
                        <div className="reply-time">{r.timeAgo}</div>
                      </div>
                    </div>
                  ))}

                  {replyOpen && (
                    <div className="reply-input-row">
                      <input
                        type="text"
                        className="reply-input"
                        placeholder={`ตอบกลับ ${c.author}...`}
                        value={replyTexts[c.id] ?? ""}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && sendReply(c.id)}
                      />
                      <button className="reply-send-btn" onClick={() => sendReply(c.id)}>
                        ส่ง
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .cmt-section { display: flex; flex-direction: column; gap: 0; }

        /* Rating overview */
        .rating-overview {
          display: flex;
          gap: 32px;
          align-items: center;
          padding: 24px;
          background: #fafbfc;
          border-radius: 24px;
          border: 1.5px solid #f1f5f9;
          margin-bottom: 24px;
        }
        .rating-big-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .rating-number { font-size: 48px; font-weight: 900; color: #0f172a; line-height: 1; }
        .rating-count { font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 4px; }
        .rating-bars { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .bar-row { display: flex; align-items: center; gap: 8px; }
        .bar-label { font-size: 12px; color: #64748b; font-weight: 700; min-width: 30px; text-align: right; }
        .bar-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .bar-fill { height: 100%; background: #f59e0b; border-radius: 999px; transition: width 0.6s ease; }
        .bar-count { font-size: 11px; color: #94a3b8; min-width: 24px; }

        /* Write review */
        .write-review {
          background: white;
          border: 1.5px solid #f1f5f9;
          border-radius: 24px;
          padding: 22px 24px;
          margin-bottom: 28px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }
        .write-review-title { font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 14px; }
        .star-picker { display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
        .star-btn {
          font-size: 26px;
          color: #f59e0b;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: transform 0.15s;
        }
        .star-btn:hover { transform: scale(1.2); }
        .star-label { font-size: 13px; font-weight: 700; color: #64748b; margin-left: 8px; }
        .review-textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          resize: none;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
        }
        .review-textarea:focus { border-color: #93c5fd; background: white; }
        .review-submit-row { display: flex; justify-content: flex-end; margin-top: 12px; }
        .review-submit-btn {
          padding: 9px 22px;
          border-radius: 14px;
          border: none;
          background: #3b82f6;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 4px 12px rgba(59,130,246,0.25);
        }
        .review-submit-btn:hover { background: #2563eb; transform: translateY(-1px); }
        .review-submit-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; transform: none; }

        /* Comment list */
        .cmt-list-header {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cmt-count { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .cmt-list { display: flex; flex-direction: column; gap: 0; }

        /* Comment item */
        .cmt-item {
          padding: 20px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .cmt-item:last-child { border-bottom: none; }
        .cmt-hdr { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
        .cmt-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .cmt-meta { flex: 1; }
        .cmt-name {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cmt-time { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .cmt-text { font-size: 14px; line-height: 1.8; color: #475569; margin-left: 50px; margin-bottom: 10px; }
        .cmt-actions { display: flex; gap: 12px; margin-left: 50px; }
        .cmt-act-btn {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 8px;
          transition: 0.15s;
        }
        .cmt-act-btn:hover { background: #f1f5f9; color: #334155; }
        .cmt-liked { color: #e11d48 !important; }

        /* Replies */
        .replies-wrap {
          margin-left: 50px;
          margin-top: 12px;
          background: #f8fafc;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .reply-item { display: flex; gap: 8px; }
        .reply-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .reply-body { flex: 1; }
        .reply-name { font-size: 12px; font-weight: 800; color: #0f172a; }
        .reply-text { font-size: 13px; color: #475569; line-height: 1.65; margin-top: 2px; }
        .reply-time { font-size: 11px; color: #94a3b8; margin-top: 3px; }
        .reply-input-row { display: flex; gap: 8px; }
        .reply-input {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 14px;
          font-size: 13px;
          font-family: inherit;
          background: white;
          outline: none;
          transition: border-color 0.2s;
        }
        .reply-input:focus { border-color: #93c5fd; }
        .reply-send-btn {
          padding: 8px 16px;
          border-radius: 12px;
          border: none;
          background: #3b82f6;
          color: white;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          white-space: nowrap;
        }
        .reply-send-btn:hover { background: #2563eb; }

        @media (max-width: 768px) {
          .rating-overview { flex-direction: column; gap: 16px; }
          .rating-number { font-size: 36px; }
          .cmt-text, .cmt-actions, .replies-wrap { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
