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
  const myStatus = mission.participants?.[0]?.status;
  const isFull = mission.maxSlots ? mission._count.participants >= mission.maxSlots : false;
  const expired = new Date(mission.endDate) < new Date();
  const s = myStatus ? STATUS_MAP[myStatus] : null;
  const tl = timeLeft(mission.endDate);
  const isUrgent = !expired && new Date(mission.endDate).getTime() - Date.now() < 3 * 86400000;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
      display: "flex",
      flexDirection: "column",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
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
              <Link href={`/place/${mission.place.slug}`} style={{
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
          <Link href={`/place/${mission.place.slug}`} style={{
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
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      
        .mission-hero {
          background: linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #065f46 100%);
          padding: 64px 24px 80px;
          position: relative;
          overflow: hidden;
          text-align: center;
          color: #fff;
        }
        .mission-hero-inner { position: relative; max-width: 600px; margin: 0 auto; }
        .mission-hero-deco1 { position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; border-radius: 50%; background: rgba(255,255,255,0.04); pointer-events: none; }
        .mission-hero-deco2 { position: absolute; bottom: -100px; left: 10%; width: 300px; height: 300px; border-radius: 50%; background: rgba(16,185,129,0.10); pointer-events: none; }`}</style>

      {/* Hero */}
      <div className="mission-hero" style={{minHeight:350,padding:"64px 24px 80px",background:"linear-gradient(135deg,#0f172a 0%,#064e3b 50%,#065f46 100%)",color:"#fff",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div className="mission-hero-deco1" />
        <div className="mission-hero-deco2" />
        <div className="mission-hero-inner">
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, opacity: 0.7, textTransform: "uppercase", marginBottom: 8 }}>COMPLETE CHALLENGES</div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px", letterSpacing: -0.5 }}>
            ภารกิจ
          </h1>
          <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.75, marginBottom: 10 }}>Missions</div>
          <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.6, margin: "0 0 32px" }}>
            เดินทาง ถ่ายภาพ และสะสมแต้มจากสถานที่จริง<br />
            <span style={{ fontSize: 13, opacity: 0.75 }}>Visit places, capture moments, and earn rewards</span>
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{activeMissions.length}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>ภารกิจพร้อมรับ</div>
              <div style={{ fontSize: 10, opacity: 0.55 }}>Active Missions</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {missions.reduce((s, m) => s + m.rewardPoints, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>แต้มรวมทั้งหมด</div>
              <div style={{ fontSize: 10, opacity: 0.55 }}>Total Points</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.2)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>
                {missions.reduce((s, m) => s + m._count.participants, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>ผู้เข้าร่วมทั้งหมด</div>
              <div style={{ fontSize: 10, opacity: 0.55 }}>Total Participants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ minHeight: "60vh", background: "#f8fafb", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {enabled === false ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🔒</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#374151", marginBottom: 8 }}>ระบบภารกิจยังไม่เปิดให้บริการ</div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>กลับมาใหม่เร็วๆ นี้ครับ</div>
            </div>
          ) : loading ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 20 }}>ภารกิจที่เปิดรับ</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            </>
          ) : missions.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              background: "#fff", borderRadius: 20,
              boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>ยังไม่มีภารกิจในขณะนี้</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>กลับมาใหม่เร็วๆ นี้ ทีมงานกำลังเตรียมภารกิจสุดพิเศษ</div>
            </div>
          ) : (
            <>
              {/* Active missions */}
              {activeMissions.length > 0 && (
                <div style={{ marginBottom: 48, animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 24, background: "#10b981", borderRadius: 2 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
                      ภารกิจที่เปิดรับ
                    </h2>
                    <span style={{ background: "#d1fae5", color: "#059669", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>
                      {activeMissions.length} ภารกิจ
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
                    {activeMissions.map(m => (
                      <MissionCard key={m.id} mission={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Expired missions */}
              {expiredMissions.length > 0 && (
                <div style={{ animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 4, height: 24, background: "#9ca3af", borderRadius: 2 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#6b7280", margin: 0 }}>
                      ภารกิจที่ผ่านมาแล้ว
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, opacity: 0.7 }}>
                    {expiredMissions.map(m => (
                      <MissionCard key={m.id} mission={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
