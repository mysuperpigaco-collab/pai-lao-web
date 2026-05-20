"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function AdminTripsPage() {
  const [trips, setTrips]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState("");
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; title: string; action: "toggle" | "delete"; published?: boolean } | null>(null);
  const [msg, setMsg]         = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ q, status, page: String(page), limit: "20" });
    fetch(`/api/admin/trips?${params}`)
      .then(r => r.json())
      .then(d => { setTrips(d.trips || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!confirm || confirm.action !== "toggle") return;
    const res = await fetch("/api/admin/trips", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: confirm.id, action: "togglePublish" }),
    });
    const d = await res.json();
    setMsg(d.message || "อัปเดตแล้ว");
    setConfirm(null);
    load();
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async () => {
    if (!confirm || confirm.action !== "delete") return;
    const res = await fetch("/api/admin/trips", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: confirm.id }),
    });
    const d = await res.json();
    setMsg(d.message || "ลบแล้ว");
    setConfirm(null);
    load();
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">🗺️ จัดการทริป</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} ทริป</span>
          {msg && <span style={{ color:"#43e97b", fontSize:"0.8rem", fontWeight:600 }}>✓ {msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-filters">
              <input
                className="adm-input"
                placeholder="ค้นหาชื่อทริป / author..."
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setPage(1); load(); } }}
              />
              <select className="adm-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">ทุกสถานะ</option>
                <option value="published">เผยแพร่แล้ว</option>
                <option value="draft">แบบร่าง</option>
              </select>
              <button className="adm-btn primary sm" onClick={() => { setPage(1); load(); }}>ค้นหา</button>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ทริป</th>
                  <th>ผู้เขียน</th>
                  <th>สถานะ</th>
                  <th>❤️ ถูกใจ</th>
                  <th>⭐ รีวิว</th>
                  <th>🔖 บุ๊กมาร์ก</th>
                  <th>👁️ วิว</th>
                  <th>สร้างเมื่อ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : trips.length === 0 ? (
                  <tr><td colSpan={9} className="adm-empty">ไม่พบทริป</td></tr>
                ) : trips.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <img src={t.coverUrl} className="adm-thumb" alt="" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                        <div>
                          <div style={{ fontWeight:600, color:"#e2e8f0", fontSize:"0.82rem", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                          <div style={{ fontSize:"0.7rem", color:"#64748b" }}>{t.mood} {t.location ? `· ${t.location}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize:"0.78rem", color:"#e2e8f0" }}>{t.author.displayName || t.author.firstName}</div>
                      <div style={{ fontSize:"0.7rem", color:"#64748b" }}>@{t.author.username}</div>
                    </td>
                    <td>
                      <span className={`adm-pill ${t.isPublished ? "green" : "gray"}`}>
                        {t.isPublished ? "เผยแพร่" : "แบบร่าง"}
                      </span>
                    </td>
                    <td style={{ color:"#f9a8d4", textAlign:"center" }}>{t._count.likes}</td>
                    <td style={{ color:"#fde68a", textAlign:"center" }}>{t._count.reviews}</td>
                    <td style={{ color:"#67e8f9", textAlign:"center" }}>{t._count.bookmarks}</td>
                    <td style={{ color:"#94a3b8", textAlign:"center" }}>{t.viewCount}</td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem", whiteSpace:"nowrap" }}>{new Date(t.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Link href={`/trips/${t.slug}`} target="_blank" className="adm-btn ghost sm">👁️ ดู</Link>
                        <button
                          className={`adm-btn sm ${t.isPublished ? "amber" : "success"}`}
                          onClick={() => setConfirm({ id: t.id, title: t.title, action:"toggle", published: t.isPublished })}
                        >
                          {t.isPublished ? "⛔ ซ่อน" : "✅ เผยแพร่"}
                        </button>
                        <button
                          className="adm-btn danger sm"
                          onClick={() => setConfirm({ id: t.id, title: t.title, action:"delete" })}
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="adm-pagination">
              <button className="adm-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > pages) return null;
                return <button key={p} className={`adm-page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="adm-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <div className="adm-overlay" onClick={() => setConfirm(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">
              {confirm.action === "delete" ? "🗑️ ยืนยันการลบ" : confirm.published ? "⛔ ซ่อนทริป" : "✅ เผยแพร่ทริป"}
            </div>
            <div className="adm-modal-body">
              {confirm.action === "delete"
                ? <>ลบทริป <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong> ถาวร? ไม่สามารถกู้คืนได้</>
                : confirm.published
                  ? <>ซ่อนทริป <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong> จากสาธารณะ?</>
                  : <>เผยแพร่ทริป <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong>?</>
              }
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setConfirm(null)}>ยกเลิก</button>
              <button
                className={`adm-btn ${confirm.action === "delete" ? "danger" : "primary"}`}
                onClick={confirm.action === "delete" ? handleDelete : handleToggle}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
