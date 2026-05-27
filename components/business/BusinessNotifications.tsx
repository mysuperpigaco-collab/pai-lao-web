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
  return <span style={{ color: "#f59e0b", fontSize: 12 }}>{"★".repeat(r)}{"☆".repeat(5 - r)}</span>;
}

export default function BusinessNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/business/notifications")
      .then(r => r.json())
      .then(d => { setItems(d.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const unread = items.filter(n => n.replies.length === 0).length;

  return (
    <div className="bn-wrap">
      {/* Header */}
      <button className="bn-header" onClick={() => setOpen(v => !v)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
              แจ้งเตือน · Notifications
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
              รีวิวล่าสุดบนสถานที่ของคุณ · Latest reviews on your places
            </div>
          </div>
          {unread > 0 && (
            <span className="bn-badge">{unread} ใหม่</span>
          )}
        </div>
        <span className="bn-arrow" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>

      {open && (
        <div className="bn-body">
          {loading ? (
            <div><div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.00s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.1s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.2s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.08s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.18s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.28s`}}/>
            </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{position:"relative",width:36,height:36,borderRadius:10,background:"#f1f5f9",flexShrink:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.16s`}}/>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <div style={{position:"relative",width:"70%",height:9,borderRadius:5,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.26s`}}/>
            </div>
                  <div style={{position:"relative",width:"45%",height:7,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#f1f5f9 0%,#e2e8f0 45%,#f1f5f9 90%)",backgroundSize:"200% 100%",animation:`_sh 1.5s ease infinite 0.36s`}}/>
            </div>
                </div>
              </div>
              <style>{\`@keyframes _sh{0%{background-position:200% 0}100%{background-position:-200% 0}}\`}</style>
            </div></div>
          ) : items.length === 0 ? (
            <div className="bn-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p>ยังไม่มีรีวิว · No reviews yet</p>
              <small>เมื่อมีคนรีวิวสถานที่ของคุณ จะแสดงที่นี่</small>
            </div>
          ) : (
            <div className="bn-list">
              {items.map(item => {
                const authorName = item.author.displayName || item.author.firstName;
                const hasReply = item.replies.length > 0;
                return (
                  <div key={item.id} className={`bn-item${hasReply ? "" : " bn-item-new"}`}>
                    {/* Place thumbnail */}
                    <div className="bn-thumb">
                      {item.place.coverUrl
                        ? <img src={item.place.coverUrl} alt={item.place.title} />
                        : <div className="bn-thumb-ph">🏞️</div>
                      }
                    </div>

                    {/* Content */}
                    <div className="bn-content">
                      <div className="bn-top-row">
                        <span className="bn-place-name">{item.place.title}</span>
                        {!hasReply && <span className="bn-new-dot" title="ยังไม่ได้ตอบกลับ" />}
                      </div>
                      <div className="bn-meta-row">
                        {item.author.avatarUrl
                          ? <img src={item.author.avatarUrl} alt="" className="bn-avatar" />
                          : <div className="bn-avatar-ph">{authorName.slice(0, 1).toUpperCase()}</div>
                        }
                        <span className="bn-reviewer">{authorName}</span>
                        <Stars r={item.rating} />
                        <span className="bn-date">
                          {new Date(item.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="bn-text">{item.text.length > 80 ? item.text.slice(0, 80) + "…" : item.text}</p>

                      <div className="bn-actions">
                        <Link href={`/place/${item.place.slug}`} className="bn-view-btn">
                          👁 ดูสถานที่ · View Place
                        </Link>
                        {!hasReply && (
                          <Link href={`/place/${item.place.slug}#reviews`} className="bn-reply-btn">
                            🏢 ตอบกลับ · Reply
                          </Link>
                        )}
                        {hasReply && (
                          <span className="bn-replied-tag">✓ ตอบกลับแล้ว · Replied</span>
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

      <style jsx>{`
        .bn-wrap {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          margin-bottom: 28px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(15,23,42,0.04);
        }
        .bn-header {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 18px 24px; background: white; border: none; cursor: pointer;
          font-family: inherit; text-align: left; transition: background 0.15s;
        }
        .bn-header:hover { background: #f8fafc; }
        .bn-badge {
          background: #ef4444; color: white; font-size: 11px; font-weight: 800;
          padding: 2px 8px; border-radius: 999px; margin-left: 4px;
        }
        .bn-arrow { font-size: 16px; color: #94a3b8; transition: transform 0.3s; }

        .bn-body {
          border-top: 1px solid #f1f5f9;
          max-height: 520px; overflow-y: auto;
        }
        .bn-empty {
          padding: 40px; text-align: center; color: #94a3b8; font-size: 14px;
        }
        .bn-empty p { margin: 0 0 4px; color: #475569; font-weight: 600; }
        .bn-empty small { font-size: 12px; }

        .bn-list { display: flex; flex-direction: column; }
        .bn-item {
          display: flex; gap: 14px; padding: 16px 22px;
          border-bottom: 1px solid #f8fafc; transition: background 0.15s;
        }
        .bn-item:hover { background: #f8fafc; }
        .bn-item:last-child { border-bottom: none; }
        .bn-item-new { background: #fefce8; }
        .bn-item-new:hover { background: #fef9c3; }

        .bn-thumb {
          width: 60px; height: 60px; border-radius: 14px;
          overflow: hidden; flex-shrink: 0; background: #e2e8f0;
        }
        .bn-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .bn-thumb-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; }

        .bn-content { flex: 1; min-width: 0; }
        .bn-top-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .bn-place-name { font-size: 13px; font-weight: 800; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bn-new-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }

        .bn-meta-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; flex-wrap: wrap; }
        .bn-avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
        .bn-avatar-ph { width: 20px; height: 20px; border-radius: 50%; background: #3b82f6; color: white; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .bn-reviewer { font-size: 12px; font-weight: 700; color: #334155; }
        .bn-date { font-size: 11px; color: #94a3b8; margin-left: auto; }

        .bn-text { font-size: 12px; color: #64748b; margin: 0 0 8px; line-height: 1.5; }

        .bn-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .bn-view-btn {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;
          background: #eff6ff; color: #2563eb; text-decoration: none; transition: 0.15s;
        }
        .bn-view-btn:hover { background: #dbeafe; }
        .bn-reply-btn {
          font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px;
          background: #ecfdf5; color: #059669; text-decoration: none; border: 1px solid #a7f3d0; transition: 0.15s;
        }
        .bn-reply-btn:hover { background: #d1fae5; }
        .bn-replied-tag { font-size: 11px; color: #059669; font-weight: 600; }
      `}</style>
    </div>
  );
}
