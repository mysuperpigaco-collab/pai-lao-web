"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Mission = {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  reward?: string;
  rewardPoints: number;
  badgeLabel?: string;
  startDate: string;
  endDate: string;
  maxSlots?: number;
  province?: string;
  place?: { id: string; title: string; slug: string; coverUrl?: string; province?: string };
  _count: { participants: number };
  participants?: { status: string }[];
};

function timeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุแล้ว";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `เหลือ ${days} วัน`;
  return `เหลือ ${hours} ชั่วโมง`;
}

function MissionCard({ mission, onJoin, joining }: { mission: Mission; onJoin: (id: string) => void; joining: string | null }) {
  const myStatus = mission.participants?.[0]?.status;
  const isFull = mission.maxSlots ? mission._count.participants >= mission.maxSlots : false;
  const expired = new Date(mission.endDate) < new Date();

  const statusBadge = () => {
    if (!myStatus) return null;
    const map: Record<string, [string, string]> = {
      JOINED: ["#eff6ff", "#2563eb"],
      SUBMITTED: ["#fefce8", "#a16207"],
      APPROVED: ["#f0fdf4", "#059669"],
      REJECTED: ["#fff5f5", "#dc2626"],
    };
    const labels: Record<string, string> = { JOINED: "รับแล้ว", SUBMITTED: "รอตรวจ", APPROVED: "ผ่านแล้ว!", REJECTED: "ไม่ผ่าน" };
    const [bg, color] = map[myStatus] || ["#f8fafc", "#64748b"];
    return <span style={{ fontSize: "11px", fontWeight: 700, background: bg, color, padding: "3px 10px", borderRadius: "999px" }}>{labels[myStatus]}</span>;
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div style={{ height: "140px", background: mission.coverUrl ? `url(${mission.coverUrl}) center/cover` : "linear-gradient(135deg,#667eea,#4facfe)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))" }} />
        <div style={{ position: "absolute", bottom: "10px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.35)", padding: "3px 10px", borderRadius: "999px" }}>{expired ? "หมดอายุ" : timeLeft(mission.endDate)}</span>
          {mission.rewardPoints > 0 && <span style={{ fontSize: "11px", fontWeight: 700, color: "#fbbf24", background: "rgba(0,0,0,0.4)", padding: "3px 10px", borderRadius: "999px" }}>+{mission.rewardPoints} แต้ม</span>}
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{mission.title}</h3>
          {statusBadge()}
        </div>
        <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mission.description}</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
          {mission.place && <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>📍 {mission.place.title}</span>}
          {mission.badgeLabel && <span style={{ fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>🏅 {mission.badgeLabel}</span>}
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{mission._count.participants}{mission.maxSlots ? `/${mission.maxSlots}` : ""} คน</span>
        </div>
        {!myStatus && !expired && !isFull && (
          <button onClick={() => onJoin(mission.id)} disabled={joining === mission.id} style={{ width: "100%", padding: "10px", borderRadius: "12px", background: "linear-gradient(135deg,#2563eb,#10b981)", color: "#fff", fontWeight: 700, fontSize: "13px", border: "none", cursor: joining === mission.id ? "wait" : "pointer" }}>
            {joining === mission.id ? "กำลังรับ..." : "รับภารกิจ"}
          </button>
        )}
        {!myStatus && (isFull || expired) && (
          <div style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", padding: "8px 0" }}>{isFull ? "ภารกิจเต็มแล้ว" : "ภารกิจหมดอายุ"}</div>
        )}
        {myStatus === "JOINED" && (
          <Link href={`/missions/${mission.id}/submit`} style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
            ส่งผลงาน
          </Link>
        )}
        {myStatus === "APPROVED" && (
          <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#059669", padding: "8px 0" }}>ได้รับรางวัลแล้ว!</div>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [tab, setTab] = useState<"ACTIVE" | "EXPIRED">("ACTIVE");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/missions?status=${tab === "ACTIVE" ? "ACTIVE" : "ACTIVE"}`)
      .then(r => r.json())
      .then(d => { setMissions(d.missions || []); setLoading(false); });
  }, [tab]);

  const handleJoin = async (missionId: string) => {
    if (!user) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }
    setJoining(missionId);
    const res = await fetch(`/api/missions/${missionId}/join`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "เกิดข้อผิดพลาด"); }
    else {
      setMissions(prev => prev.map(m => m.id === missionId
        ? { ...m, participants: [{ status: "JOINED" }], _count: { participants: m._count.participants + 1 } }
        : m
      ));
    }
    setJoining(null);
  };

  const active = missions.filter(m => new Date(m.endDate) > new Date());
  const expired = missions.filter(m => new Date(m.endDate) <= new Date());
  const display = tab === "ACTIVE" ? active : expired;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ background: "linear-gradient(135deg,#667eea 0%,#4facfe 50%,#43e97b 100%)", padding: "48px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎯</div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>ภารกิจพิเศษ</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", margin: 0 }}>ไปสำรวจสถานที่ ถ่ายรูป รีวิว รับแต้มและ Badge</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", gap: "8px", margin: "-28px 0 24px", justifyContent: "center" }}>
          {(["ACTIVE", "EXPIRED"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 24px", borderRadius: "999px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer", background: tab === t ? "#0f172a" : "#fff", color: tab === t ? "#fff" : "#64748b", boxShadow: "0 2px 8px rgba(15,23,42,0.1)" }}>
              {t === "ACTIVE" ? `ภารกิจเปิดอยู่ (${active.length})` : `หมดอายุ (${expired.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>กำลังโหลด...</div>
        ) : display.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎯</div>
            <div>{tab === "ACTIVE" ? "ยังไม่มีภารกิจในขณะนี้" : "ไม่มีภารกิจที่หมดอายุ"}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "16px", paddingBottom: "48px" }}>
            {display.map(m => <MissionCard key={m.id} mission={m} onJoin={handleJoin} joining={joining} />)}
          </div>
        )}
      </div>
    </div>
  );
}
