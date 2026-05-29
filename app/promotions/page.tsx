"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Promotion = {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  discount?: string;
  condition?: string;
  startDate: string;
  endDate: string;
  place?: { id: string; title: string; slug: string; province?: string };
  business: { id: string; businessName: string; logoUrl?: string };
};

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุ";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "วันสุดท้าย!";
  return `เหลือ ${days} วัน`;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promotions")
      .then(r => r.json())
      .then(d => { setPromotions(d.promotions || []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg,#f59e0b 0%,#ef4444 50%,#ec4899 100%)", padding: "48px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎁</div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>โปรโมชั่นวันนี้</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", margin: 0 }}>ดีลพิเศษจากร้านค้าและสถานที่ท่องเที่ยว</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "-28px auto 0", padding: "0 16px 48px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>กำลังโหลด...</div>
        ) : promotions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", background: "#fff", borderRadius: "20px", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎁</div>
            <div style={{ color: "#94a3b8" }}>ยังไม่มีโปรโมชั่นในขณะนี้</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "16px" }}>
            {promotions.map(promo => (
              <div key={promo.id} style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
                <div style={{ height: "140px", background: promo.coverUrl ? `url(${promo.coverUrl}) center/cover` : "linear-gradient(135deg,#f59e0b,#ef4444)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.5))" }} />
                  {promo.discount && (
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: "13px", padding: "4px 12px", borderRadius: "999px" }}>{promo.discount}</div>
                  )}
                  <span style={{ position: "absolute", bottom: "10px", left: "12px", fontSize: "11px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.35)", padding: "3px 10px", borderRadius: "999px" }}>{daysLeft(promo.endDate)}</span>
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    {promo.business.logoUrl
                      ? <img src={promo.business.logoUrl} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", fontWeight: 700 }}>🏪</div>
                    }
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>{promo.business.businessName}</span>
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.3 }}>{promo.title}</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{promo.description}</p>
                  {promo.condition && <p style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600, margin: "0 0 10px" }}>📌 {promo.condition}</p>}
                  {promo.place && (
                    <Link href={`/place/${promo.place.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                      📍 {promo.place.title}
                    </Link>
                  )}
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#94a3b8" }}>
                    {new Date(promo.startDate).toLocaleDateString("th-TH")} – {new Date(promo.endDate).toLocaleDateString("th-TH")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
