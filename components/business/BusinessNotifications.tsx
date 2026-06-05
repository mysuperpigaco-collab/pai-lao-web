"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  author: { id: string; firstName: string; displayName?: string | null; avatarUrl?: string | null };
  place: { id: string; slug: string; title: string; coverUrl: string };
  replies: { id: string }[];
}

function Stars({ r }: { r: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= r ? "#f59e0b" : "#e2e8f0" }}>★</span>
      ))}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} วันที่แล้ว`;
  if (h > 0) return `${h} ชั่วโมงที่แล้ว`;
  if (m > 0) return `${m} นาทีที่แล้ว`;
  return "เมื่อกี้";
}

interface EditNotification {
  id: string;
  type: "EDIT_REJECTED";
  place: { id: string; slug: string; title: string; coverUrl: string } | null;
  rejectionReason: string;
  createdAt: string;
}

export default function BusinessNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [editAlerts, setEditAlerts] = useState<EditNotification[]>([]);
  const [dismissedEdits, setDismissedEdits] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/business/notifications")
      .then(r => r.json())
      .then(d => {
        setItems(d.notifications ?? []);
        setEditAlerts(d.editNotifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visibleEditAlerts = editAlerts.filter(a => !dismissedEdits.has(a.id));
  const unread = items.filter(n => n.replies.length === 0).length + visibleEditAlerts.length;

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #f1f5f9", marginBottom: 28, overflow: "hidden", boxShadow: "0 4px 24px rgba(15,23,42,0.06)" }}>

      {/* ── Header ── */}
      <button onClick={() => setOpen(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 22px", background: "transparent", border: "none", cursor: "pointer",
        fontFamily: "inherit", textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: unread > 0 ? "linear-gradient(135deg,#fef3c7,#fde68a)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            🔔
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              แจ้งเตือน
              {unread > 0 && (
                <span style={{ background: "#ef4444", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999, animation: "pulse 2s ease-in-out infinite" }}>
                  {unread} ใหม่
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>รีวิวและการแจ้งเตือนสถานที่ของคุณ</div>
          </div>
        </div>
        <span style={{ fontSize: 18, color: "#cbd5e1", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>⌄</span>
      </button>

      {/* ── Body ── */}
      {open && (
        <div style={{ borderTop: "1px solid #f8fafc" }}>
          {loading ? (
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize: "200% 100%", animation: `_sh 1.5s ease infinite ${i*0.1}s` }} />
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ height: 10, width: "55%", borderRadius: 5, background: "#f1f5f9", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize: "200% 100%", animation: `_sh 1.5s ease infinite ${i*0.1+0.15}s` }} />
                    </div>
                    <div style={{ height: 8, width: "80%", borderRadius: 4, background: "#f1f5f9", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)", backgroundSize: "200% 100%", animation: `_sh 1.5s ease infinite ${i*0.1+0.25}s` }} />
                    </div>
                  </div>
                </div>
              ))}
              <style>{`@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {/* ── Rejected edit alerts ── */}
              {visibleEditAlerts.map((alert) => (
                <div key={alert.id} style={{
                  display: "flex", gap: 14, padding: "14px 22px",
                  borderBottom: "1px solid #f8fafc", background: "#fff5f5",
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden", background: "#fee2e2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    ✗
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#991b1b" }}>การแก้ไขถูกปฏิเสธ</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(alert.createdAt)}</span>
                        <button onClick={() => setDismissedEdits(prev => new Set([...prev, alert.id]))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "#475569", margin: "0 0 6px", fontWeight: 600 }}>
                      📍 {alert.place?.title}
                    </p>
                    <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 8px" }}>
                      เหตุผล: {alert.rejectionReason}
                    </p>
                    {alert.place && (
                      <a href={`/business/places/${alert.place.slug}/edit`} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", textDecoration: "none", border: "1px solid #fecaca" }}>
                        แก้ไขใหม่
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {/* empty state — เมื่อไม่มีทั้ง review และ alert */}
              {items.length === 0 && visibleEditAlerts.length === 0 && (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#334155", marginBottom: 4 }}>ยังไม่มีการแจ้งเตือน</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>เมื่อมีรีวิวหรือการแจ้งเตือน จะแสดงที่นี่</div>
                </div>
              )}
              {items.map((item, idx) => {
                const authorName = item.author.displayName || item.author.firstName;
                const hasReply   = item.replies.length > 0;
                return (
                  <div key={item.id} style={{
                    display: "flex", gap: 14, padding: "16px 22px",
                    borderBottom: idx < items.length - 1 ? "1px solid #f8fafc" : "none",
                    background: hasReply ? "transparent" : "#fffbeb",
                    transition: "background 0.15s",
                  }}>
                    {/* Place thumb */}
                    <div style={{ width: 52, height: 52, borderRadius: 14, overflow: "hidden", background: "#e2e8f0", flexShrink: 0, position: "relative" }}>
                      {item.place.coverUrl
                        ? <img src={item.place.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏞️</div>
                      }
                      {!hasReply && (
                        <span style={{ position: "absolute", top: 4, right: 4, width: 9, height: 9, borderRadius: "50%", background: "#ef4444", border: "2px solid white" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{item.place.title}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{timeAgo(item.createdAt)}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        {item.author.avatarUrl
                          ? <img src={item.author.avatarUrl} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                          : <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#3b82f6", color: "white", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{authorName.slice(0,1).toUpperCase()}</div>
                        }
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{authorName}</span>
                        <Stars r={item.rating} />
                      </div>

                      {item.text && (
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                          "{item.text}"
                        </p>
                      )}

                      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                        <Link href={`/place/${item.place.slug}`} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#eff6ff", color: "#2563eb", textDecoration: "none", border: "1px solid #dbeafe" }}>
                          ดูสถานที่
                        </Link>
                        {!hasReply ? (
                          <Link href={`/place/${item.place.slug}#reviews`} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "#ecfdf5", color: "#059669", textDecoration: "none", border: "1px solid #a7f3d0" }}>
                            ตอบกลับ
                          </Link>
                        ) : (
                          <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✓ ตอบกลับแล้ว</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
    </div>
  );
}
