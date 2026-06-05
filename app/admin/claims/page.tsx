"use client";
import { useEffect, useState, useCallback } from "react";

interface ClaimItem {
  id: string;
  status: string;
  message: string | null;
  adminNote: string | null;
  createdAt: string;
  place: { id: string; slug: string; title: string; coverUrl: string; province: string; district: string; category: string };
  business: { id: string; businessName: string; logoUrl: string | null; phone: string | null; email: string | null; isVerified: boolean; user: { username: string; displayName: string | null; avatarUrl: string | null; email: string | null } };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:  { label: "⏳ รอตรวจสอบ",   bg: "#451a03", color: "#fbbf24" },
  DISPUTED: { label: "⚔️ โต้แย้ง",     bg: "#3b0764", color: "#c084fc" },
  APPROVED: { label: "✅ อนุมัติแล้ว", bg: "#052e16", color: "#4ade80" },
  REJECTED: { label: "❌ ปฏิเสธ",      bg: "#450a0a", color: "#f87171" },
};

type FilterType = "ACTIVE" | "PENDING" | "DISPUTED" | "APPROVED" | "REJECTED" | "ALL";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ACTIVE");
  const [busy, setBusy] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/place-claims?status=${filter}`)
      .then(r => r.json())
      .then(d => { setClaims(d.claims ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handle = async (claimId: string, action: "APPROVE" | "REJECT") => {
    setBusy(claimId);
    await fetch("/api/admin/place-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action, adminNote: noteMap[claimId] ?? "" }),
    });
    setBusy(null);
    setNoteMap(prev => { const n = { ...prev }; delete n[claimId]; return n; });
    load();
  };

  const TABS: { key: FilterType; label: string }[] = [
    { key: "ACTIVE",   label: "รอดำเนินการ" },
    { key: "PENDING",  label: "Claim" },
    { key: "DISPUTED", label: "โต้แย้ง" },
    { key: "APPROVED", label: "อนุมัติแล้ว" },
    { key: "REJECTED", label: "ปฏิเสธ" },
    { key: "ALL",      label: "ทั้งหมด" },
  ];

  return (
    <div className="adm-content">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 className="adm-title">🏢 คำขอ Claim สถานที่</h1>
        <button onClick={load} style={{ padding: "8px 18px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
          🔄 รีเฟรช
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid", borderColor: filter === t.key ? "#3b82f6" : "#334155", background: filter === t.key ? "#1d4ed8" : "#1e293b", color: filter === t.key ? "white" : "#94a3b8", fontWeight: filter === t.key ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="adm-empty">⏳ กำลังโหลด...</div>
      ) : claims.length === 0 ? (
        <div className="adm-empty">ไม่มีคำขอในหมวดนี้</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {claims.map(c => {
            const ss = STATUS_STYLE[c.status] ?? STATUS_STYLE.PENDING;
            const isActive = c.status === "PENDING" || c.status === "DISPUTED";
            return (
              <div key={c.id} style={{ background: "#1e293b", borderRadius: 14, border: `1px solid ${c.status === "DISPUTED" ? "#6b21a8" : "#334155"}`, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #334155", flexWrap: "wrap" }}>
                  {/* Place info */}
                  <img src={c.place.coverUrl || "/images/default-place.svg"} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9" }}>{c.place.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>📍 {c.place.province?.split(" (")[0]} · {c.place.district} · {c.place.category}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: ss.bg, color: ss.color }}>{ss.label}</span>
                    <a href={`/place/${c.place.slug}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "#0f172a", color: "#64748b", textDecoration: "none", border: "1px solid #334155" }}>
                      ดูสถานที่ →
                    </a>
                  </div>
                </div>

                {/* Business info */}
                <div style={{ padding: "12px 18px", borderBottom: isActive ? "1px solid #334155" : "none", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {c.business.user.avatarUrl
                      ? <img src={c.business.user.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏢</div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{c.business.businessName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>@{c.business.user.username} · {c.business.email || c.business.user.email || "ไม่มีอีเมล"}</div>
                    </div>
                    {c.business.isVerified && <span style={{ fontSize: 10, background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>✓ Verified</span>}
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "#475569" }}>{fmt(c.createdAt)}</div>
                  {c.status === "DISPUTED" && (
                    <div style={{ width: "100%", background: "#2e1065", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#c084fc" }}>
                      <strong>⚔️ เหตุผลโต้แย้ง:</strong> {c.message || "ไม่ระบุ"}
                    </div>
                  )}
                  {c.status === "PENDING" && c.message && (
                    <div style={{ width: "100%", background: "#172554", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#93c5fd" }}>
                      <strong>📝 ข้อความ:</strong> {c.message}
                    </div>
                  )}
                  {!isActive && c.adminNote && (
                    <div style={{ width: "100%", background: "#0f172a", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#64748b" }}>
                      <strong>🗒️ หมายเหตุ:</strong> {c.adminNote}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isActive && (
                  <div style={{ padding: "12px 18px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      value={noteMap[c.id] ?? ""}
                      onChange={e => setNoteMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="หมายเหตุถึงผู้ขอ (ไม่บังคับ)"
                      style={{ flex: 1, minWidth: 200, padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                    />
                    <button onClick={() => handle(c.id, "APPROVE")} disabled={busy === c.id}
                      style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: busy === c.id ? "#334155" : "#16a34a", color: "white", fontWeight: 700, fontSize: 13, cursor: busy === c.id ? "wait" : "pointer", fontFamily: "inherit" }}>
                      {c.status === "DISPUTED" ? "✅ โอนสิทธิ์" : "✅ อนุมัติ"}
                    </button>
                    <button onClick={() => handle(c.id, "REJECT")} disabled={busy === c.id}
                      style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: busy === c.id ? "#334155" : "#dc2626", color: "white", fontWeight: 700, fontSize: 13, cursor: busy === c.id ? "wait" : "pointer", fontFamily: "inherit" }}>
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
