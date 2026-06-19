"use client";
import { useEffect, useState } from "react";
import { useTiltCard } from "@/hooks/useTiltCard";
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
  place?: { id: string; title: string; slug: string; coverUrl?: string };
  _count: { participants: number };
  participants?: { status: string }[];
};

function timeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุแล้ว";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `เหลือ ${days} วัน`;
  return `เหลือ ${hours} ชม.`;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  JOINED:    { label: "รับแล้ว",    color: "#2563eb", bg: "#dbeafe" },
  SUBMITTED: { label: "รอตรวจ",    color: "#b45309", bg: "#fef3c7" },
  APPROVED:  { label: "ผ่านแล้ว!", color: "#059669", bg: "#d1fae5" },
  REJECTED:  { label: "ไม่ผ่าน",   color: "#dc2626", bg: "#fee2e2" },
};

function SkeletonCard() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ height: 180, background: "#e5e7eb" }} />
      <div style={{ padding: "16px 20px 20px" }}>
        <div style={{ height: 14, background: "#e5e7eb", borderRadius: 6, width: "40%", marginBottom: 10 }} />
        <div style={{ height: 20, background: "#e5e7eb", borderRadius: 6, width: "80%", marginBottom: 8 }} />
        <div style={{ height: 14, background: "#e5e7eb", borderRadius: 6, width: "60%", marginBottom: 20 }} />
        <div style={{ height: 40, background: "#e5e7eb", borderRadius: 10 }} />
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "success" ? "#059669" : "#dc2626",
      color: "#fff", padding: "14px 20px", borderRadius: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 15, fontWeight: 600,
      animation: "slideUp 0.3s ease",
    }}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}

function MissionCard({ mission }: {
  mission: Mission;
}) {
  const { cardRef, shineRef, onMove, onLeave, shineStyle } = useTiltCard();
  const myStatus = mission.participants?.[0]?.status;
  const isFull = mission.maxSlots ? mission._count.participants >= mission.maxSlots : false;
  const expired = new Date(mission.endDate) < new Date();
  const s = myStatus ? STATUS_MAP[myStatus] : null;
  const tl = timeLeft(mission.endDate);
  const isUrgent = !expired && new Date(mission.endDate).getTime() - Date.now() < 3 * 86400000;

  return (
    <div ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        willChange: "transform",
      }}>
      <div ref={shineRef} style={shineStyle} />
      {/* Cover */}
      <div style={{ position: "relative", height: 180, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", flexShrink: 0 }}>
        {mission.coverUrl ? (
          <img src={mission.coverUrl} alt={mission.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            🎯
          </div>
        )}
        {/* Time badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: isUrgent ? "#ef4444" : expired ? "#9ca3af" : "rgba(0,0,0,0.55)",
          color: "#fff", borderRadius: 20, padding: "4px 10px",
          fontSize: 12, fontWeight: 700,
        }}>
          {tl}
        </div>
        {/* Status badge */}
        {s && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: s.bg, color: s.color, borderRadius: 20,
            padding: "4px 10px", fontSize: 12, fontWeight: 700,
          }}>
            {s.label}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Province / place */}
        {(mission.province || mission.place) && (
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
            📍 {mission.place ? mission.place.title : mission.province}
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6, lineHeight: 1.4 }}>
          {mission.title}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, flex: 1, lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {mission.description}
        </div>

        {/* Rewards row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {mission.rewardPoints > 0 && (
            <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
              ⭐ {mission.rewardPoints} แต้ม
            </span>
          )}
          {mission.badgeLabel && (
            <span style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
              🏅 {mission.badgeLabel}
            </span>
          )}
          {mission.reward && (
            <span style={{ background: "#fce7f3", color: "#be185d", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
              🎁 {mission.reward}
            </span>
          )}
        </div>

        {/* Slots */}
        {mission.maxSlots && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              <span>ผู้เข้าร่วม</span>
              <span style={{ fontWeight: 600, color: isFull ? "#ef4444" : "#111827" }}>
                {mission._count.participants}/{mission.maxSlots}
              </span>
            </div>
            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${Math.min(100, (mission._count.participants / mission.maxSlots) * 100)}%`,
                background: isFull ? "#ef4444" : "#10b981",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}

        {/* Action */}
        {expired ? (
          <div style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", padding: "10px 0" }}>
            ภารกิจสิ้นสุดแล้ว
          </div>
        ) : myStatus === "SUBMITTED" ? (
          <div style={{ textAlign: "center", padding: "11px 0", borderRadius: 10,
            background: "#dbeafe", color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}>
            ⏳ รอแอดมินตรวจสอบ
          </div>
        ) : myStatus === "APPROVED" ? (
          <div style={{ textAlign: "center", padding: "11px 0", borderRadius: 10,
            background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 14 }}>
            ✅ อนุมัติแล้ว!
          </div>
        ) : myStatus === "REJECTED" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ textAlign: "center", padding: "8px 0", color: "#dc2626", fontWeight: 700, fontSize: 13 }}>
              ❌ ไม่ผ่าน — ส่งใหม่ได้เลย
            </div>
            {mission.place?.slug && (
              <Link href={`/place/${mission.place.slug}`} target="_blank" rel="noopener noreferrer" style={{
                display: "block", textAlign: "center",
                background: "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "#fff", padding: "11px 0", borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>
                📨 ส่งผลงานใหม่ →
              </Link>
            )}
          </div>
        ) : mission.place?.slug ? (
          <Link href={`/place/${mission.place.slug}`} target="_blank" rel="noopener noreferrer" style={{
            display: "block", textAlign: "center",
            background: "linear-gradient(135deg,#10b981,#059669)",
            color: "#fff", padding: "11px 0", borderRadius: 10,
            fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            🎯 ไปส่งผลงานที่สถานที่ →
          </Link>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0", fontSize: 13, color: "#6b7280" }}>
            ไปสถานที่และส่งผลงานผ่านหน้าสถานที่
          </div>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const on = d.settings?.missionsEnabled === "true";
        setEnabled(on);
        if (on) {
          fetch("/api/missions")
            .then(r => r.json())
            .then(d2 => { setMissions(d2.missions || []); setLoading(false); })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => { setEnabled(true); setLoading(false); });
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };



  const activeMissions = missions.filter(m => new Date(m.endDate) >= new Date());
  const expiredMissions = missions.filter(m => new Date(m.endDate) < new Date());

  return (
    <>
      {/* Hero — pure inline, no CSS class dependency */}
      <div style={{
        position: "relative", overflow: "hidden",
        minHeight: 420, padding: "64px 24px 80px",
        textAlign: "center", color: "#fff",
        background: "linear-gradient(135deg,#0f172a 0%,#064e3b 50%,#065f46 100%)",
      }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(16,185,129,0.10)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", zIndex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 800, color: "rgba(255,255,255,0.55)", marginBottom: 14, textTransform: "uppercase" }}>COMPLETE CHALLENGES</div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.1 }}>
            ภารกิจ <span style={{ color: "#34d399" }}>Missions</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 36px", lineHeight: 1.8 }}>
            เดินทาง ถ่ายภาพ และสะสมแต้มจากสถานที่จริง<br />
            <span style={{ fontSize: 13, opacity: 0.75 }}>Visit places, capture moments, and earn rewards</span>
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{activeMissions.length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>ภารกิจที่เปิดอยู่</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Active Missions</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.25)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{new Set(activeMissions.map(m => m.province).filter(Boolean)).size}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>จังหวัด</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Provinces</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.25)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{activeMissions.reduce((s, m) => s + (m.rewardPoints || 0), 0).toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>แต้มรวม</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ minHeight: "60vh", background: "transparent", padding: "32px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {enabled === false ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🔒</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#374151", marginBottom: 8 }}>ระบบภารกิจยังไม่เปิดให้บริการ</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>กลับมาใหม่เร็วๆ นี้ครับ</div>
            </div>
          ) : loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }}>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : activeMissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🎯</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 8 }}>ยังไม่มีภารกิจในขณะนี้</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>กลับมาใหม่เร็วๆ นี้นะครับ</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }}>
              {activeMissions.map(mission => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
