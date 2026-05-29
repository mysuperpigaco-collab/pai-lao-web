"use client";
import { useEffect, useState } from "react";

type Mission = { id: string; title: string; status: string; endDate: string; rewardPoints: number; _count: { participants: number }; place?: { title: string } };
type Submission = { id: string; status: string; photoUrls: string[]; reviewText?: string; submittedAt: string; user: { username: string; displayName: string; avatarUrl?: string }; mission: { title: string; rewardPoints: number; badgeLabel?: string } };

export default function AdminMissionsPage() {
  const [tab, setTab] = useState<"missions" | "submissions">("missions");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", reward: "", rewardPoints: "0", badgeLabel: "", startDate: "", endDate: "", maxSlots: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/missions?tab=${tab}`).then(r => r.json()).then(d => {
      if (tab === "missions") setMissions(d.missions || []);
      else setSubmissions(d.submissions || []);
    });
  }, [tab]);

  const createMission = async () => {
    if (!form.title || !form.startDate || !form.endDate) { setMsg("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/missions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rewardPoints: Number(form.rewardPoints) }) });
    const data = await res.json();
    if (res.ok) { setMsg("✅ สร้างภารกิจสำเร็จ"); setShowForm(false); setMissions(p => [data.mission, ...p]); }
    else setMsg("❌ " + (data.error || "เกิดข้อผิดพลาด"));
    setSaving(false);
  };

  const handleSubmission = async (participantId: string, action: "APPROVE" | "REJECT", adminNote = "") => {
    setProcessing(participantId);
    await fetch("/api/admin/missions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantId, action, adminNote }) });
    setSubmissions(p => p.filter(s => s.id !== participantId));
    setProcessing(null);
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0 }}>จัดการภารกิจ</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#667eea,#4facfe)", color: "#fff", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>+ สร้างภารกิจ</button>
      </div>

      {msg && <p style={{ fontWeight: 700, color: msg.startsWith("✅") ? "#15803d" : "#dc2626", marginBottom: "16px" }}>{msg}</p>}

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1.5px solid #e2e8f0", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px" }}>สร้างภารกิจใหม่</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[["ชื่อภารกิจ *", "title"], ["รางวัล", "reward"], ["แต้มที่ได้รับ", "rewardPoints"], ["ชื่อ Badge", "badgeLabel"], ["จำนวนสูงสุด (คน)", "maxSlots"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>รายละเอียด</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            {[["วันเริ่ม *", "startDate"], ["วันหมดอายุ *", "endDate"]].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>{label}</label>
                <input type="date" value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={createMission} disabled={saving} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#667eea,#4facfe)", color: "#fff", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>{saving ? "กำลังสร้าง..." : "สร้างภารกิจ"}</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#64748b", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>ยกเลิก</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["missions", "submissions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "999px", fontWeight: 700, fontSize: "13px", border: "none", cursor: "pointer", background: tab === t ? "#0f172a" : "#f1f5f9", color: tab === t ? "#fff" : "#64748b" }}>
            {t === "missions" ? "ภารกิจทั้งหมด" : `ผลงานรอตรวจ (${submissions.length})`}
          </button>
        ))}
      </div>

      {tab === "missions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {missions.map(m => (
            <div key={m.id} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", border: "1.5px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px" }}>{m.title}</div>
                {m.place && <div style={{ fontSize: "12px", color: "#2563eb" }}>📍 {m.place.title}</div>}
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>หมดอายุ {new Date(m.endDate).toLocaleDateString("th-TH")} · {m._count.participants} คนร่วม · +{m.rewardPoints} แต้ม</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "999px", background: m.status === "ACTIVE" ? "#f0fdf4" : "#f8fafc", color: m.status === "ACTIVE" ? "#059669" : "#94a3b8" }}>{m.status}</span>
            </div>
          ))}
          {missions.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>ยังไม่มีภารกิจ</div>}
        </div>
      )}

      {tab === "submissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {submissions.map(s => (
            <div key={s.id} style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                {s.user.avatarUrl
                  ? <img src={s.user.avatarUrl} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#4facfe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{s.user.displayName?.[0]}</div>
                }
                <div>
                  <div style={{ fontWeight: 700 }}>{s.user.displayName} <span style={{ color: "#64748b", fontWeight: 400, fontSize: "12px" }}>@{s.user.username}</span></div>
                  <div style={{ fontSize: "12px", color: "#2563eb" }}>ภารกิจ: {s.mission.title}</div>
                </div>
              </div>
              {s.reviewText && <p style={{ fontSize: "13px", color: "#334155", marginBottom: "12px", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>{s.reviewText}</p>}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                {s.photoUrls.map((url, i) => <img key={i} src={url} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "2px solid #e2e8f0" }} />)}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleSubmission(s.id, "APPROVE")} disabled={processing === s.id} style={{ padding: "8px 20px", background: "#10b981", color: "#fff", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>✅ อนุมัติ (+{s.mission.rewardPoints} แต้ม)</button>
                <button onClick={() => handleSubmission(s.id, "REJECT")} disabled={processing === s.id} style={{ padding: "8px 20px", background: "#fee2e2", color: "#dc2626", borderRadius: "10px", fontWeight: 700, border: "none", cursor: "pointer" }}>❌ ปฏิเสธ</button>
              </div>
            </div>
          ))}
          {submissions.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>ไม่มีผลงานรอตรวจ</div>}
        </div>
      )}
    </div>
  );
}
