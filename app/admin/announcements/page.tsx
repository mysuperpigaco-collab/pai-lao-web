"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Announcement {
  id:         string;
  title:      string;
  body:       string;
  icon:       string;
  type:       string;
  targetRole: string | null;
  isActive:   boolean;
  expiresAt:  string | null;
  createdAt:  string;
  createdBy:  { username: string; displayName: string | null };
}

const TYPE_OPTIONS = [
  { value: "info",    label: "💙 ข้อมูล",   color: "#2563eb", bg: "#eff6ff" },
  { value: "success", label: "💚 ดีงาม",    color: "#16a34a", bg: "#f0fdf4" },
  { value: "warning", label: "🟡 แจ้งเตือน", color: "#d97706", bg: "#fffbeb" },
  { value: "tip",     label: "💜 เคล็ดลับ", color: "#7c3aed", bg: "#f5f3ff" },
];
const ROLE_OPTIONS = [
  { value: "",          label: "ทุกคน" },
  { value: "TRAVELER",  label: "Traveler เท่านั้น" },
  { value: "BUSINESS",  label: "Business เท่านั้น" },
];
const ICON_OPTIONS = ["📢","🎉","⚠️","🔔","💡","🛠️","🎁","🚀","❤️","🌟"];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AnnouncementsPage() {
  const [list,    setList   ] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [error,   setError  ] = useState("");
  const [success, setSuccess] = useState("");

  // form state
  const [title,      setTitle     ] = useState("");
  const [body,       setBody      ] = useState("");
  const [icon,       setIcon      ] = useState("📢");
  const [type,       setType      ] = useState("info");
  const [targetRole, setTargetRole] = useState("");
  const [expiresAt,  setExpiresAt ] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/announcements")
      .then(r => r.json())
      .then(d => { setList(d.announcements ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { setError("กรุณากรอกหัวข้อและเนื้อหา"); return; }
    setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, icon, type, targetRole: targetRole || null, expiresAt: expiresAt || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSuccess("สร้างประกาศสำเร็จ");
      setTitle(""); setBody(""); setIcon("📢"); setType("info"); setTargetRole(""); setExpiresAt("");
      load();
    } else {
      setError(data.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("ปิดประกาศนี้?")) return;
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const typeMeta = (t: string) => TYPE_OPTIONS.find(o => o.value === t) ?? TYPE_OPTIONS[0];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "inherit", padding: "32px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link href="/admin" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: "#1e293b", padding: "8px 14px", borderRadius: 10, border: "1px solid #334155" }}>
            ← กลับ Admin
          </Link>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📢 จัดการประกาศ</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>ส่งประกาศไปยังกล่อง Notifications ของ user</p>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 20px", color: "#f1f5f9" }}>✍️ สร้างประกาศใหม่</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* icon + type row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>ไอคอน</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setIcon(ic)}
                      style={{ fontSize: 20, padding: "6px 8px", borderRadius: 8, border: `2px solid ${icon === ic ? "#38bdf8" : "#334155"}`, background: icon === ic ? "#0f172a" : "transparent", cursor: "pointer", lineHeight: 1 }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>ประเภท</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {TYPE_OPTIONS.map(o => (
                    <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" name="type" value={o.value} checked={type === o.value} onChange={() => setType(o.value)} style={{ accentColor: o.color }} />
                      <span style={{ color: type === o.value ? o.color : "#94a3b8", fontWeight: type === o.value ? 700 : 400 }}>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* title */}
            <div>
              <label style={labelStyle}>หัวข้อ *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น อัปเดตระบบใหม่!" maxLength={100}
                style={inputStyle} />
            </div>

            {/* body */}
            <div>
              <label style={labelStyle}>เนื้อหา *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="รายละเอียดประกาศ..." rows={3} maxLength={500}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* target + expires row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>ส่งถึง</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={inputStyle}>
                  {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>หมดอายุ (ไม่บังคับ)</label>
                <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {error   && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>⚠️ {error}</p>}
            {success && <p style={{ color: "#4ade80", fontSize: 13, margin: 0 }}>✅ {success}</p>}

            {/* preview */}
            {(title || body) && (
              <div style={{ background: typeMeta(type).bg, border: `1.5px solid`, borderColor: type === "info" ? "#bfdbfe" : type === "success" ? "#bbf7d0" : type === "warning" ? "#fde68a" : "#ddd6fe", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 13, color: typeMeta(type).color, margin: "0 0 2px" }}>{title || "หัวข้อ..."}</p>
                  <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>{body || "เนื้อหา..."}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={saving}
              style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: saving ? "#334155" : "linear-gradient(135deg,#0ea5e9,#2563eb)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: saving ? "wait" : "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}>
              {saving ? "⏳ กำลังส่ง..." : "📢 ส่งประกาศ"}
            </button>
          </form>
        </div>

        {/* List */}
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px" }}>ประกาศทั้งหมด ({list.length})</h2>
        {loading ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>กำลังโหลด...</p>
        ) : list.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>ยังไม่มีประกาศ</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map(a => {
              const m = typeMeta(a.type);
              return (
                <div key={a.id} style={{ background: "#1e293b", border: `1px solid ${a.isActive ? "#334155" : "#1e293b"}`, borderRadius: 14, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", opacity: a.isActive ? 1 : 0.45 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#f1f5f9" }}>{a.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: m.bg, color: m.color }}>{m.label}</span>
                      {a.targetRole && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#334155", color: "#94a3b8" }}>{a.targetRole}</span>}
                      {!a.isActive && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#450a0a", color: "#f87171" }}>ปิดแล้ว</span>}
                    </div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.5 }}>{a.body}</p>
                    <div style={{ fontSize: 11, color: "#475569", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>โดย {a.createdBy.displayName || a.createdBy.username}</span>
                      <span>{fmt(a.createdAt)}</span>
                      {a.expiresAt && <span>หมดอายุ: {fmt(a.expiresAt)}</span>}
                    </div>
                  </div>
                  {a.isActive && (
                    <button onClick={() => handleDeactivate(a.id)}
                      style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      ปิด
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#94a3b8" };
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", marginTop: 6,
  background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
  padding: "9px 12px", color: "#f1f5f9", fontFamily: "inherit", fontSize: 13, outline: "none",
};
