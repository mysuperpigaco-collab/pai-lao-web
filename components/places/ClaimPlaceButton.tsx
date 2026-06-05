"use client";
import { useEffect, useState } from "react";

interface Props {
  placeSlug: string;
  placeTitle: string;
  isBusiness: boolean;   // current user is BUSINESS role
  hasOwner: boolean;     // place already has businessId
  isOwner?: boolean;     // current user IS the owner of this place
}

type ClaimStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "DISPUTED";

export default function ClaimPlaceButton({ placeSlug, placeTitle, isBusiness, hasOwner, isOwner = false }: Props) {
  const [status, setStatus]       = useState<ClaimStatus>("NONE");
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [message, setMessage]     = useState("");
  const [done, setDone]           = useState(false);

  // Fetch existing claim/dispute on mount
  useEffect(() => {
    if (!isBusiness) return;
    fetch(`/api/places/${placeSlug}/claim-request`)
      .then(r => r.json())
      .then(d => {
        if (d.claim) {
          setStatus(d.claim.status as ClaimStatus);
          setAdminNote(d.claim.adminNote ?? null);
        }
      })
      .catch(() => {});
  }, [placeSlug, isBusiness, hasOwner]);

  if (!isBusiness || isOwner) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/places/${placeSlug}/claim-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok || res.status === 200) {
        setStatus(data.status === "APPROVED" ? "APPROVED" : "PENDING");
        setDone(true);
        setShowForm(false);
      } else {
        alert(data.message ?? "เกิดข้อผิดพลาด");
      }
    } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); }
    setLoading(false);
  };

  const statusColors: Record<ClaimStatus, string> = {
    NONE: "#10b981",
    PENDING: "#f59e0b",
    APPROVED: "#10b981",
    REJECTED: "#ef4444",
  };

  // ── Dispute UI (สถานที่มีเจ้าของแล้ว) ──────────────────────
  if (hasOwner) {
    const alreadyDisputed = status === "DISPUTED" || done;
    return (
      <div style={{ background: "#fefce8", border: "1.5px solid #fde68a", borderRadius: 16, padding: "16px 18px", marginTop: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#92400e", marginBottom: 6 }}>⚔️ โต้แย้งความเป็นเจ้าของ</div>
        {alreadyDisputed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#fef9c3", color: "#92400e", fontWeight: 800, fontSize: 13, padding: "7px 14px", borderRadius: 999 }}>
              ⏳ คำขอโต้แย้งอยู่ระหว่างการพิจารณา
            </span>
          </div>
        ) : status === "REJECTED" && adminNote ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 800, fontSize: 13, padding: "7px 14px", borderRadius: 999, display: "inline-block" }}>❌ คำขอโต้แย้งถูกปฏิเสธ</span>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>เหตุผล: {adminNote}</p>
            <button onClick={() => { setStatus("NONE"); setDone(false); setShowForm(false); }}
              style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 10, border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              ส่งคำขอใหม่
            </button>
          </div>
        ) : !showForm ? (
          <>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
              หากคุณเชื่อว่าเป็นเจ้าของที่แท้จริงของ <strong>{placeTitle}</strong> สามารถยื่นคำขอโต้แย้งได้ แอดมินจะตรวจสอบและตัดสิน
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              ⚔️ ยื่นคำขอโต้แย้ง
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}>ระบุเหตุผล * (ขั้นต่ำ 10 ตัวอักษร)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="เช่น ฉันเป็นเจ้าของที่แท้จริง มีเอกสารยืนยัน โทร... เปิดมาตั้งแต่..."
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #fde68a", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", background: "#fff" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={async () => {
                if (message.length < 10) { alert("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร"); return; }
                setLoading(true);
                try {
                  const res = await fetch(`/api/places/${placeSlug}/claim`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message }),
                  });
                  const data = await res.json();
                  if (res.ok) { setDone(true); setShowForm(false); }
                  else alert(data.message ?? "เกิดข้อผิดพลาด");
                } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); }
                setLoading(false);
              }} disabled={loading || message.length < 10}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: loading || message.length < 10 ? "#e2e8f0" : "#f59e0b", color: loading || message.length < 10 ? "#94a3b8" : "#fff", fontWeight: 800, fontSize: 13, cursor: loading || message.length < 10 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {loading ? "⏳ กำลังส่ง..." : "📨 ส่งคำขอโต้แย้ง"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "9px 14px", borderRadius: 10, border: "1.5px solid #fde68a", background: "#fff", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: "#f0fdf4", border: "1.5px solid #6ee7b7",
      borderRadius: 16, padding: "16px 18px", marginTop: 8,
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#065f46", marginBottom: 6 }}>
        🏢 นี่คือสถานที่ของคุณหรือไม่?
      </div>

      {status === "NONE" && !done && (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            หากคุณเป็นเจ้าของสถานที่ <strong>{placeTitle}</strong> สามารถยื่นขอยืนยันสิทธิ์ได้
            แอดมินจะตรวจสอบและอนุมัติภายใน 1–3 วันทำการ
          </p>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: "#10b981", color: "#fff", fontWeight: 800,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>
              🏢 ยืนยันความเป็นเจ้าของ
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                ข้อความถึงแอดมิน (ไม่บังคับ)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="เช่น ฉันเป็นเจ้าของร้าน บ้านปลายงาม ที่อยู่... โทร..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 12px", borderRadius: 10,
                  border: "1.5px solid #d1fae5", fontSize: 13,
                  fontFamily: "inherit", resize: "vertical", outline: "none",
                  background: "#fff",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submit} disabled={loading} style={{
                  flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                  background: "#10b981", color: "#fff", fontWeight: 800,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? "⏳ กำลังส่ง..." : "📨 ส่งคำขอ"}
                </button>
                <button onClick={() => setShowForm(false)} style={{
                  padding: "9px 14px", borderRadius: 10,
                  border: "1.5px solid #d1fae5", background: "#fff",
                  color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}>
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(status === "PENDING" || done) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "#fef9c3", color: "#92400e",
            fontWeight: 800, fontSize: 13,
            padding: "7px 14px", borderRadius: 999,
          }}>
            ⏳ รอแอดมินอนุมัติ
          </div>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            ระบบจะแจ้งผลผ่านอีเมลที่ลงทะเบียน
          </span>
        </div>
      )}

      {status === "APPROVED" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#dcfce7", color: "#15803d", fontWeight: 800, fontSize: 13, padding: "7px 14px", borderRadius: 999 }}>
            ✅ อนุมัติแล้ว — คุณเป็นเจ้าของสถานที่นี้
          </div>
        </div>
      )}

      {status === "REJECTED" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", fontWeight: 800, fontSize: 13, padding: "7px 14px", borderRadius: 999, display: "inline-block" }}>
            ❌ คำขอถูกปฏิเสธ
          </div>
          {adminNote && (
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>เหตุผล: {adminNote}</p>
          )}
          <button onClick={() => { setStatus("NONE"); setDone(false); }} style={{
            alignSelf: "flex-start", padding: "7px 14px", borderRadius: 10,
            border: "1.5px solid #fca5a5", background: "#fff",
            color: "#dc2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
          }}>
            ส่งคำขอใหม่
          </button>
        </div>
      )}
    </div>
  );
}
