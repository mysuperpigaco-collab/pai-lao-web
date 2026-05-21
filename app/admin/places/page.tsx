"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const CATS = ["","NATURE","CAFE","ACCOMMODATION","CAMPING","FOOD","TEMPLE","BEACH","MARKET","ADVENTURE","MUSEUM"];
const CAT_LABELS: Record<string,string> = {
  NATURE:"ธรรมชาติ",CAFE:"คาเฟ่",ACCOMMODATION:"ที่พัก",CAMPING:"แคมปิ้ง",
  FOOD:"อาหาร",TEMPLE:"วัด",BEACH:"ทะเล",MARKET:"ตลาด",ADVENTURE:"ผจญภัย",MUSEUM:"พิพิธภัณฑ์"
};

export default function AdminPlacesPage() {
  const [places, setPlaces]   = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState("");
  const [category, setCategory] = useState("");
  const [verified, setVerified] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; title: string; action: "verify" | "delete" | "revoke"; isVerified?: boolean; hasOwner?: boolean } | null>(null);
  const [msg, setMsg]         = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ q, category, verified, page: String(page), limit: "20" });
    fetch(`/api/admin/places?${params}`)
      .then(r => r.json())
      .then(d => { setPlaces(d.places || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [q, category, verified, page]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    if (!confirm || confirm.action !== "verify") return;
    const res = await fetch("/api/admin/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: confirm.id, action: "toggleVerify" }),
    });
    const d = await res.json();
    setMsg(d.message || "อัปเดตแล้ว");
    setConfirm(null); load();
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRevoke = async () => {
    if (!confirm || confirm.action !== "revoke") return;
    const res = await fetch("/api/admin/places", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: confirm.id, action: "revoke-ownership" }),
    });
    const d = await res.json();
    setMsg(d.message || "ยกเลิกความเป็นเจ้าของแล้ว");
    setConfirm(null); load();
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async () => {
    if (!confirm || confirm.action !== "delete") return;
    const res = await fetch("/api/admin/places", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: confirm.id }),
    });
    const d = await res.json();
    setMsg(d.message || "ลบแล้ว");
    setConfirm(null); load();
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">📍 จัดการสถานที่</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} สถานที่</span>
          {msg && <span style={{ color:"#43e97b", fontSize:"0.8rem", fontWeight:600 }}>✓ {msg}</span>}
        </div>
      </div>

      <div className="adm-content">
        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-filters">
              <input className="adm-input" placeholder="ค้นหาชื่อ / จังหวัด..." value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setPage(1); load(); } }}
              />
              <select className="adm-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                <option value="">ทุกหมวดหมู่</option>
                {CATS.filter(c => c).map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
              </select>
              <select className="adm-select" value={verified} onChange={e => { setVerified(e.target.value); setPage(1); }}>
                <option value="">ทุกสถานะ</option>
                <option value="true">ยืนยันแล้ว ✅</option>
                <option value="false">รอยืนยัน ⏳</option>
              </select>
              <button className="adm-btn primary sm" onClick={() => { setPage(1); load(); }}>ค้นหา</button>
            </div>
          </div>

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>สถานที่</th>
                  <th>หมวด</th>
                  <th>จังหวัด</th>
                  <th>เจ้าของ</th>
                  <th>ยืนยัน</th>
                  <th>⭐ รีวิว</th>
                  <th>❤️ ถูกใจ</th>
                  <th>👁️ วิว</th>
                  <th>สร้างเมื่อ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="adm-empty">⏳ กำลังโหลด...</td></tr>
                ) : places.length === 0 ? (
                  <tr><td colSpan={10} className="adm-empty">ไม่พบสถานที่</td></tr>
                ) : places.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <img src={p.coverUrl} className="adm-thumb" alt=""
                          onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                        <div>
                          <div style={{ fontWeight:600, color:"#e2e8f0", fontSize:"0.82rem", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div>
                          <div style={{ fontSize:"0.7rem", color:"#64748b" }}>{p.district}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="adm-pill cyan">{CAT_LABELS[p.category] || p.category}</span></td>
                    <td style={{ color:"#94a3b8", fontSize:"0.78rem" }}>{p.province}</td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem" }}>
                      {p.business ? (
                        <span>{p.business.businessName}<br /><span style={{color:"#475569"}}>@{p.business.user?.username}</span></span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`adm-pill ${p.isVerified ? "green" : "amber"}`}>
                        {p.isVerified ? "✅ ยืนยัน" : "⏳ รอ"}
                      </span>
                    </td>
                    <td style={{ color:"#fde68a", textAlign:"center" }}>{p._count.reviews}</td>
                    <td style={{ color:"#f9a8d4", textAlign:"center" }}>{p._count.likes}</td>
                    <td style={{ color:"#94a3b8", textAlign:"center" }}>{p.viewCount}</td>
                    <td style={{ color:"#64748b", fontSize:"0.75rem", whiteSpace:"nowrap" }}>{new Date(p.createdAt).toLocaleDateString("th-TH")}</td>
                    <td>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <Link href={`/place/${p.slug}`} target="_blank" className="adm-btn ghost sm">👁️ ดู</Link>
                        <button
                          className={`adm-btn sm ${p.isVerified ? "amber" : "success"}`}
                          onClick={() => setConfirm({ id: p.id, title: p.title, action:"verify", isVerified: p.isVerified })}
                        >
                          {p.isVerified ? "⛔ ยกเลิก" : "✅ ยืนยัน"}
                        </button>
                        {p.business && (
                          <button className="adm-btn sm" style={{ background: "#7c3aed" }}
                            onClick={() => setConfirm({ id: p.id, title: p.title, action:"revoke", hasOwner: true })}>
                            🔓 ถอนสิทธิ์
                          </button>
                        )}
                        <button className="adm-btn danger sm"
                          onClick={() => setConfirm({ id: p.id, title: p.title, action:"delete" })}>
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
              {confirm.action === "delete" ? "🗑️ ยืนยันการลบ" : confirm.action === "revoke" ? "🔓 ถอนความเป็นเจ้าของ" : confirm.isVerified ? "⛔ ยกเลิกยืนยัน" : "✅ ยืนยันสถานที่"}
            </div>
            <div className="adm-modal-body">
              {confirm.action === "delete"
                ? <>ลบสถานที่ <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong> ถาวร?</>
                : confirm.action === "revoke"
                  ? <><strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong> จะไม่มีเจ้าของอีกต่อไป เจ้าของเดิมจะสูญเสียสิทธิ์การจัดการสถานที่นี้ ยืนยันหรือไม่?</>
                  : confirm.isVerified
                    ? <>ยกเลิกการยืนยัน <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong>?</>
                    : <>ยืนยันสถานที่ <strong style={{color:"#e2e8f0"}}>"{confirm.title}"</strong>?</>
              }
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setConfirm(null)}>ยกเลิก</button>
              <button
                className={`adm-btn ${confirm.action === "delete" ? "danger" : confirm.action === "revoke" ? "" : "primary"}`}
                style={confirm.action === "revoke" ? { background: "#7c3aed" } : {}}
                onClick={confirm.action === "delete" ? handleDelete : confirm.action === "revoke" ? handleRevoke : handleVerify}
              >ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
