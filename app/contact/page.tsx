"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "general",     label: "🌐 ทั่วไป" },
  { value: "business",    label: "🏢 เจ้าของธุรกิจ" },
  { value: "bug",         label: "🐛 แจ้งปัญหาเว็บ" },
  { value: "content",     label: "🚩 เนื้อหาไม่เหมาะสม" },
  { value: "ads",         label: "📣 ติดต่อโฆษณา" },
  { value: "partnership", label: "🤝 ความร่วมมือ" },
  { value: "other",       label: "💬 อื่นๆ" },
];

export default function ContactPage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", category: searchParams.get("cat") ?? "general", subject: "", message: "" });
  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) set("category", cat);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) setSent(true);
      else setError(d.error || "เกิดข้อผิดพลาด");
    } catch { setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่"); }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit",
    background: "var(--pl-white)", color: "var(--pl-text-primary)", outline: "none", boxSizing: "border-box",
  };

  if (sent) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "40px 20px" }}>
      <div style={{ background: "var(--pl-white)", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 440, boxShadow: "0 8px 40px rgba(15,23,42,0.10)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 10px" }}>ส่งข้อความสำเร็จ!</h2>
        <p style={{ color: "var(--pl-text-secondary)", fontSize: 14, lineHeight: 1.7, margin: "0 0 8px" }}>
          ทีมงานไปเล่าได้รับข้อความของคุณแล้ว และจะตอบกลับทางอีเมล
        </p>
        <p style={{ color: "var(--pl-text-muted)", fontSize: 13, margin: "0 0 28px" }}>
          📧 {form.email}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => { setSent(false); setForm({ name: "", email: "", category: "general", subject: "", message: "" }); }}
            style={{ padding: "11px 24px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "var(--pl-white)", color: "var(--pl-text-secondary)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            ส่งอีกครั้ง
          </button>
          <Link href="/" style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: "#10b981", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 10px" }}>ติดต่อเรา</h1>
        <p style={{ color: "var(--pl-text-secondary)", fontSize: 15, margin: 0 }}>
          Contact Us · ทีมงานพร้อมช่วยเหลือทุกวัน
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }} className="contact-grid">

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: "var(--pl-white)", borderRadius: 20, border: "1.5px solid var(--pl-border)", padding: "28px 28px 24px", boxShadow: "0 4px 24px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Name + Email */}
          <div className="contact-name-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 6 }}>ชื่อ *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อของคุณ" required style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 6 }}>อีเมล *</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" required style={inp} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 6 }}>หมวดหมู่</label>
            <div className="contact-cats" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => set("category", c.value)}
                  style={{ padding: "7px 14px", borderRadius: 999, border: "1.5px solid", borderColor: form.category === c.value ? "#10b981" : "#e2e8f0", background: form.category === c.value ? "#f0fdf4" : "var(--pl-white)", color: form.category === c.value ? "#065f46" : "#475569", fontWeight: form.category === c.value ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 6 }}>หัวข้อ</label>
            <input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="สรุปหัวข้อสั้นๆ" style={inp} />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 6 }}>ข้อความ * <span style={{ color: "var(--pl-text-muted)", fontWeight: 400 }}>(ขั้นต่ำ 10 ตัวอักษร)</span></label>
            <textarea value={form.message} onChange={e => set("message", e.target.value)} placeholder="เขียนข้อความของคุณที่นี่..." rows={6} required
              style={{ ...inp, resize: "vertical", minHeight: 140 }} />
            <div style={{ fontSize: 11, color: form.message.length < 10 ? "#ef4444" : "#94a3b8", marginTop: 4, textAlign: "right" }}>
              {form.message.length} ตัวอักษร
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 700, padding: "12px 16px", borderRadius: 10, border: "1px solid #fecaca" }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding: "14px", borderRadius: 14, border: "none", background: loading ? "#e2e8f0" : "linear-gradient(135deg,#10b981,#059669)", color: loading ? "#94a3b8" : "white", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {loading ? "⏳ กำลังส่ง..." : "📨 ส่งข้อความ"}
          </button>
        </form>

        {/* Sidebar info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: "var(--pl-white)", borderRadius: 16, border: "1.5px solid var(--pl-border)", padding: "20px", boxShadow: "0 2px 12px rgba(15,23,42,0.05)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--pl-text-primary)", marginBottom: 12 }}>📬 ข้อมูลติดต่อ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>
                <div style={{ fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 2 }}>อีเมล</div>
                <a href="mailto:supportpailao@gmail.com" style={{ color: "#2563eb" }}>supportpailao@gmail.com</a>
              </div>
              <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>
                <div style={{ fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 2 }}>เวลาทำการ</div>
                ทุกวัน 9:00 – 18:00 น.
              </div>
              <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>
                <div style={{ fontWeight: 700, color: "var(--pl-text-secondary)", marginBottom: 2 }}>เวลาตอบกลับ</div>
                ภายใน 1–2 วันทำการ
              </div>
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 16, padding: "20px", color: "white" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>🔍 ลองดู FAQ ก่อนไหม?</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 14px", lineHeight: 1.6 }}>
              คำถามส่วนใหญ่มีคำตอบอยู่ในหน้า FAQ ของเราแล้ว
            </p>
            <Link href="/faq" style={{ display: "inline-block", padding: "9px 18px", background: "rgba(255,255,255,0.12)", color: "white", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 13, border: "1px solid rgba(255,255,255,0.2)" }}>
              ดู FAQ →
            </Link>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-grid form {
            order: 1;
          }
        }
        @media (max-width: 480px) {
          .contact-name-row {
            grid-template-columns: 1fr !important;
          }
          .contact-cats {
            flex-direction: column !important;
          }
          .contact-cats button {
            border-radius: 12px !important;
            width: 100%;
            text-align: left;
          }
        }
        input:focus, textarea:focus, select:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
      `}</style>
    </div>
  );
}
