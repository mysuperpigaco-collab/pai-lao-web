"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Promotion = {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  discount?: string;
  endDate: string;
  place?: { title: string; slug: string };
  business: { businessName: string; logoUrl?: string };
};

function daysLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุ";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "วันสุดท้าย!";
  return `เหลือ ${days} วัน`;
}

export default function PromotionSection() {
  const [enabled, setEnabled] = useState(false);
  const [promos, setPromos] = useState<Promotion[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        if (d.settings?.promotionsEnabled === "true") {
          setEnabled(true);
          fetch("/api/promotions")
            .then(r => r.json())
            .then(d2 => setPromos((d2.promotions || []).slice(0, 4)));
        }
      });
  }, []);

  if (!enabled || promos.length === 0) return null;

  return (
    <section style={{ padding: "0 0 32px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>🎁 โปรโมชั่นวันนี้</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>ดีลพิเศษจากร้านค้าและสถานที่ท่องเที่ยว</p>
          </div>
          <Link href="/promotions" style={{ fontSize: "13px", fontWeight: 700, color: "#ef4444", textDecoration: "none" }}>ดูทั้งหมด →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          {promos.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.05)" }}>
              <div style={{ height: "110px", background: p.coverUrl ? `url(${p.coverUrl}) center/cover` : "linear-gradient(135deg,#f59e0b,#ef4444)", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.45))" }} />
                {p.discount && <div style={{ position: "absolute", top: "8px", right: "8px", background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: "11px", padding: "2px 8px", borderRadius: "999px" }}>{p.discount}</div>}
                <span style={{ position: "absolute", bottom: "8px", left: "10px", fontSize: "10px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.35)", padding: "2px 8px", borderRadius: "999px" }}>{daysLeft(p.endDate)}</span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>{p.business.businessName}</span>
                </div>
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.3 }}>{p.title}</h3>
                {p.place && (
                  <Link href={`/place/${p.place.slug}`} style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>📍 {p.place.title}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
