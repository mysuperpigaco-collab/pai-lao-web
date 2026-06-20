"use client";
import { useState } from "react";

/**
 * AIPolish — ปุ่ม "เกลาคำด้วย AI" สำหรับเนื้อหาทริป
 * ดึงข้อความจาก editor (HTML) → ส่งไปเกลาเป็น 3 สำนวน → ให้ผู้ใช้เลือกแล้วใส่กลับ
 */
type Opt = { key: string; label: string; text: string };

function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+\n/g, "\n").trim();
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function toHtml(text: string) {
  return text.split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`).join("");
}

const TONE_COLOR: Record<string, [string, string]> = {
  concise: ["#eff6ff", "#1d4ed8"],
  vivid:   ["#fef3c7", "#b45309"],
  polite:  ["#ecfdf5", "#047857"],
};

export default function AIPolish({
  value, onApply, mode = "overall",
}: {
  value: string;
  onApply: (html: string) => void;
  mode?: "overall" | "stop";
}) {
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<Opt[] | null>(null);
  const [err, setErr] = useState("");

  const run = async () => {
    const text = stripHtml(value);
    if (text.length < 10) { setErr("เขียนเนื้อหาอย่างน้อยสัก 1–2 ประโยคก่อนนะครับ"); setOpts(null); return; }
    setLoading(true); setErr(""); setOpts(null);
    try {
      const r = await fetch("/api/ai/polish-text", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error || "เกิดข้อผิดพลาด");
      else setOpts(d.options ?? []);
    } catch { setErr("เชื่อมต่อ AI ไม่ได้ ลองใหม่อีกครั้ง"); }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={run} disabled={loading} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 999, border: "1.5px solid #c4b5fd",
        background: loading ? "#ede9fe" : "linear-gradient(135deg,#f5f3ff,#ede9fe)",
        color: "#6d28d9", fontWeight: 800, fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
      }}>
        {loading ? "⏳ กำลังเกลา..." : "✨ เกลาคำด้วย AI"}
      </button>

      {err && <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{err}</div>}

      {opts && opts.length > 0 && (
        <div style={{ marginTop: 12, border: "1.5px solid #ede9fe", borderRadius: 16, padding: 14, background: "#faf9ff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#5b21b6" }}>✨ เลือกสำนวน</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={run} disabled={loading} style={{
                padding: "4px 12px", borderRadius: 8, border: "1px solid #ddd6fe", background: "#fff",
                color: "#6d28d9", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>🔄 ลองใหม่</button>
              <button type="button" onClick={() => setOpts(null)} style={{
                padding: "4px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>ปิด</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {opts.map(o => {
              const [bg, fg] = TONE_COLOR[o.key] ?? ["#f1f5f9", "#475569"];
              return (
                <div key={o.key} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 999, background: bg, color: fg }}>{o.label}</span>
                    <button type="button" onClick={() => { onApply(toHtml(o.text)); setOpts(null); }} style={{
                      padding: "5px 14px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg,#7c3aed,#6366f1)", color: "#fff",
                      fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    }}>ใช้อันนี้ ✓</button>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{o.text}</p>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
            💡 “ใช้อันนี้” จะแทนที่เนื้อหาในช่องด้านบน (รูปภาพที่แทรกไว้จะถูกแทนที่ด้วยข้อความ)
          </div>
        </div>
      )}
    </div>
  );
}
