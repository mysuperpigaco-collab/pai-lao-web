"use client";
import { useEffect, useState } from "react";

type Promotion = { id: string; title: string; description: string; discount?: string; condition?: string; startDate: string; endDate: string; status: string; adminNote?: string; place?: { title: string; slug: string }; business: { businessName: string; logoUrl?: string } };

export default function AdminPromotionsPage() {
  const [tab, setTab] = useState<"PENDING" | "ACTIVE" | "REJECTED">("PENDING");
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/admin/promotions?status=${tab}`).then(r => r.json()).then(d => setPromos(d.promotions || []));
  }, [tab]);

  const handle = async (promotionId: string, action: "APPROVE" | "REJECT") => {
    setProcessing(promotionId);
    const res = await fetch("/api/admin/promotions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promotionId, action, adminNote: note[promotionId] || "" }) });
    if (res.ok) setPromos(p => p.filter(x => x.id !== promotionId));
    setProcessing(null);
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: "900px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 24px" }}>จัดการโปรโมชั่น</h1>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["PENDING", "ACTIVE", "REJECTED"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "999px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer", background: tab === t ? "#0f172a" : "#f1f5f9", color: tab === t ? "#fff" : "#64748b" }}>
            {t === "PENDING" ? "รอการอนุมัติ" : t === "ACTIVE" ? "กำลังแสดง" : "ถูกปฏิเสธ"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {promos.map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1.5px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "16px" }}>{p.title}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>โดย {p.business.businessName}</div>
              </div>
              {p.discount && <span style={{ fontSize: "12px", fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "3px 12px", borderRadius: "999px" }}>{p.discount}</span>}
            </div>
            <p style={{ fontSize: "13px", color: "#334155", margin: "0 0 8px" }}>{p.description}</p>
            {p.condition && <p style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600, margin: "0 0 8px" }}>📌 {p.condition}</p>}
            {p.place && <div style={{ fontSize: "12px", color: "#2563eb", marginBottom: "8px" }}>📍 {p.place.title}</div>}
            <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
              {new Date(p.startDate).toLocaleDateString("th-TH")} – {new Date(p.endDate).toLocaleDateString("th-TH")}
            </div>
            {tab === "PENDING" && (
              <>
                <input value={note[p.id] || ""} onChange={e => setNote(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder="หมายเหตุ (ไม่บังคับ)" style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => handle(p.id, "APPROVE")} disabled={processing === p.id} style={{ padding: "8px 20px", background: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>✅ อนุมัติ</button>
                  <button onClick={() => handle(p.id, "REJECT")} disabled={processing === p.id} style={{ padding: "8px 20px", background: "#fee2e2", color: "#dc2626", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>❌ ปฏิเสธ</button>
                </div>
              </>
            )}
          </div>
        ))}
        {promos.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>ไม่มีโปรโมชั่นในหมวดนี้</div>}
      </div>
    </div>
  );
}
