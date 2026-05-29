"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Mission = {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  rewardPoints: number;
  badgeLabel?: string;
  endDate: string;
  province?: string;
  place?: { title: string; slug: string };
  _count: { participants: number };
};

function timeLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุ";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "วันสุดท้าย!";
  return `เหลือ ${days} วัน`;
}

export default function MissionSection() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    fetch("/api/missions?status=ACTIVE")
      .then(r => r.json())
      .then(d => setMissions((d.missions || []).slice(0, 4)));
  }, []);

  if (missions.length === 0) return null;

  return (
    <section style={{ padding: "32px 0" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px" }}>🎯 ภารกิจพิเศษ</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>ไปสำรวจ ถ่ายรูป รีวิว รับแต้มและ Badge</p>
          </div>
          <Link href="/missions" style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>ดูทั้งหมด →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "14px" }}>
          {missions.map(m => (
            <Link key={m.id} href="/missions" style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", transition: "transform 0.15s", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
                <div style={{ height: "110px", background: m.coverUrl ? `url(${m.coverUrl}) center/cover` : "linear-gradient(135deg,#667eea,#4facfe)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.5))" }} />
                  <div style={{ position: "absolute", bottom: "8px", left: "10px", right: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.35)", padding: "2px 8px", borderRadius: "999px" }}>{timeLeft(m.endDate)}</span>
                    {m.rewardPoints > 0 && <span style={{ fontSize: "10px", fontWeight: 700, color: "#fbbf24", background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: "999px" }}>+{m.rewardPoints} แต้ม</span>}
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.title}</h3>
                  {m.place && <p style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, margin: "0 0 4px" }}>📍 {m.place.title}</p>}
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {m.badgeLabel && <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "999px", fontWeight: 600 }}>🏅 {m.badgeLabel}</span>}
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{m._count.participants} คนร่วม</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
