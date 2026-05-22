"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PROVINCES, getDistricts } from "@/data/thailand";

const CATS = ["","NATURE","CAFE","ACCOMMODATION","CAMPING","FOOD","TEMPLE","BEACH","MARKET","ADVENTURE","MUSEUM"];
const CAT_LABELS: Record<string,string> = {
  NATURE:"ธรรมชาติ",CAFE:"คาเฟ่",ACCOMMODATION:"ที่พัก",CAMPING:"แคมปิ้ง",
  FOOD:"อาหาร",TEMPLE:"วัด",BEACH:"ทะเล",MARKET:"ตลาด",ADVENTURE:"ผจญภัย",MUSEUM:"พิพิธภัณฑ์"
};
const CAT_OPTIONS = [
  { value:"NATURE",      label:"ธรรมชาติ" },
  { value:"CAFE",        label:"คาเฟ่" },
  { value:"ACCOMMODATION",label:"ที่พัก" },
  { value:"CAMPING",     label:"แคมปิ้ง" },
  { value:"FOOD",        label:"อาหาร / ร้านอาหาร" },
  { value:"TEMPLE",      label:"วัด / ศาสนสถาน" },
  { value:"BEACH",       label:"ชายหาด / ทะเล" },
  { value:"MARKET",      label:"ตลาด / ช้อปปิ้ง" },
  { value:"ADVENTURE",   label:"กีฬา / ผจญภัย" },
  { value:"MUSEUM",      label:"พิพิธภัณฑ์ / ประวัติศาสตร์" },
];

const emptyForm = () => ({
  title:"", titleEn:"", category:"", province:"", district:"",
  address:"", googleMapsUrl:"", description:"", descriptionShort:"",
  coverUrl:"", openHours:"", closedDays:"", entryFee:"", phone:"", website:"", lineId:"",
});

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

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm());
  const [districts, setDistricts]   = useState<string[]>([]);
  const [creating, setCreating]     = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createErr, setCreateErr]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ q, category, verified, page: String(page), limit: "20" });
    fetch(`/api/admin/places?${params}`)
      .then(r => r.json())
      .then(d => { setPlaces(d.places || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .finally(() => setLoading(false));
  }, [q, category, verified, page]);

  useEffect(() => { load(); }, [load]);

  // Update districts when province changes
  const setField = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === "province") {
      setDistricts(getDistricts(v));
      setForm(f => ({ ...f, province: v, district: "" }));
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.province || !form.district || !form.category || !form.description.trim()) {
      setCreateErr("กรุณากรอกข้อมูลที่จำเป็น: ชื่อ, หมวดหมู่, จังหวัด, อำเภอ, คำอธิบาย");
      return;
    }
    setCreating(true); setCreateErr("");
    const res = await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateErr(d.message || "เกิดข้อผิดพลาด"); return; }
    setMsg(d.message || "เพิ่มสถานที่สำเร็จ");
    setCreatedSlug(d.place?.slug || "");
    setShowCreate(false);
    setForm(emptyForm());
    load();
    setTimeout(() => setMsg(""), 4000);
  };

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

  const inp: React.CSSProperties = {
    width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #334155",
    background:"#1e293b", color:"#e2e8f0", fontSize:"0.82rem", boxSizing:"border-box",
  };
  const lbl: React.CSSProperties = {
    display:"block", fontSize:"0.7rem", fontWeight:700, color:"#94a3b8",
    textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4,
  };

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">📍 จัดการสถานที่</div>
        <div className="adm-topbar-right">
          <span style={{ color:"#64748b", fontSize:"0.8rem" }}>ทั้งหมด {total.toLocaleString()} สถานที่</span>
          {msg && (
            <span style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#43e97b", fontSize:"0.8rem", fontWeight:600 }}>✓ {msg}</span>
              {createdSlug && (
                <a href={`/place/${createdSlug}`} target="_blank"
                   style={{ fontSize:"0.78rem", background:"#1e3a5f", color:"#60a5fa", border:"1px solid #3b82f6",
                            borderRadius:6, padding:"2px 10px", textDecoration:"none", fontWeight:600 }}>
                  👁️ ดูสถานที่
                </a>
              )}
            </span>
          )}
          <button className="adm-btn primary sm" onClick={() => { setShowCreate(true); setCreateErr(""); setForm(emptyForm()); setCreatedSlug(""); }}>
            ➕ เพิ่มสถานที่
          </button>
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
                      ) : <span style={{color:"#475569"}}>— (แอดมิน)</span>}
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

      {/* ── Create Place Modal ─────────────────────────────── */}
      {showCreate && (
        <div className="adm-overlay" onClick={() => setShowCreate(false)}>
          <div className="adm-modal" style={{ maxWidth:620, width:"95vw", maxHeight:"90vh", overflowY:"auto" }}
               onClick={e => e.stopPropagation()}>
            <div className="adm-modal-title">➕ เพิ่มสถานที่ใหม่</div>
            <div className="adm-modal-body" style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* row: title + titleEn */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>ชื่อสถานที่ · Name *</label>
                  <input style={inp} value={form.title} placeholder="ชื่อภาษาไทย"
                    onChange={e => setField("title", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>ชื่อภาษาอังกฤษ · English Name</label>
                  <input style={inp} value={form.titleEn} placeholder="English name (optional)"
                    onChange={e => setField("titleEn", e.target.value)} />
                </div>
              </div>

              {/* row: category */}
              <div>
                <label style={lbl}>หมวดหมู่ · Category *</label>
                <select style={inp} value={form.category} onChange={e => setField("category", e.target.value)}>
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {CAT_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* row: province + district */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>จังหวัด · Province *</label>
                  <select style={inp} value={form.province} onChange={e => setField("province", e.target.value)}>
                    <option value="">-- เลือกจังหวัด --</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>อำเภอ / เขต · District *</label>
                  <select style={inp} value={form.district} onChange={e => setField("district", e.target.value)}
                          disabled={!form.province}>
                    <option value="">-- เลือกอำเภอ --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* row: address + googlemaps */}
              <div>
                <label style={lbl}>ที่อยู่ · Address</label>
                <input style={inp} value={form.address} placeholder="ที่อยู่โดยละเอียด"
                  onChange={e => setField("address", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Google Maps URL</label>
                <input style={inp} value={form.googleMapsUrl} placeholder="https://maps.google.com/..."
                  onChange={e => setField("googleMapsUrl", e.target.value)} />
              </div>

              {/* description */}
              <div>
                <label style={lbl}>คำอธิบาย · Description *</label>
                <textarea style={{ ...inp, minHeight:90, resize:"vertical" }} value={form.description}
                  placeholder="รายละเอียดสถานที่..."
                  onChange={e => setField("description", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>คำอธิบายสั้น · Short Description</label>
                <input style={inp} value={form.descriptionShort} placeholder="สรุปสั้นๆ (แสดงบนการ์ด)"
                  onChange={e => setField("descriptionShort", e.target.value)} />
              </div>

              {/* coverUrl */}
              <div>
                <label style={lbl}>URL รูปหน้าปก · Cover Image URL</label>
                <input style={inp} value={form.coverUrl} placeholder="https://..."
                  onChange={e => setField("coverUrl", e.target.value)} />
                {form.coverUrl && (
                  <img src={form.coverUrl} alt="preview" style={{ marginTop:6, height:80, borderRadius:6, objectFit:"cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                )}
              </div>

              {/* row: openHours + closedDays + entryFee */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>เวลาเปิด · Open Hours</label>
                  <input style={inp} value={form.openHours} placeholder="08:00–18:00"
                    onChange={e => setField("openHours", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>วันหยุด · Closed Days</label>
                  <input style={inp} value={form.closedDays} placeholder="วันจันทร์"
                    onChange={e => setField("closedDays", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>ค่าเข้า · Entry Fee</label>
                  <input style={inp} value={form.entryFee} placeholder="ฟรี / 50 บาท"
                    onChange={e => setField("entryFee", e.target.value)} />
                </div>
              </div>

              {/* row: phone + website + lineId */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>โทรศัพท์ · Phone</label>
                  <input style={inp} value={form.phone} placeholder="0XX-XXX-XXXX"
                    onChange={e => setField("phone", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>เว็บไซต์ · Website</label>
                  <input style={inp} value={form.website} placeholder="https://..."
                    onChange={e => setField("website", e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>LINE ID</label>
                  <input style={inp} value={form.lineId} placeholder="@lineid"
                    onChange={e => setField("lineId", e.target.value)} />
                </div>
              </div>

              {createErr && (
                <div style={{ background:"#7f1d1d", color:"#fca5a5", borderRadius:8, padding:"8px 12px", fontSize:"0.8rem" }}>
                  ⚠️ {createErr}
                </div>
              )}

              <div style={{ background:"#0f172a", borderRadius:8, padding:"8px 12px", fontSize:"0.75rem", color:"#64748b" }}>
                ℹ️ สถานที่ที่แอดมินเพิ่มจะได้รับการ <strong style={{color:"#43e97b"}}>อนุมัติและยืนยันทันที</strong> โดยไม่ต้องรอ
              </div>
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn ghost" onClick={() => setShowCreate(false)}>ยกเลิก</button>
              <button className="adm-btn primary" onClick={handleCreate} disabled={creating}>
                {creating ? "⏳ กำลังบันทึก..." : "✅ บันทึกสถานที่"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ──────────────────────────────────── */}
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
