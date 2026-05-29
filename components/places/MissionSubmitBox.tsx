"use client";
import { useRef, useState } from "react";

interface Mission {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  badgeLabel?: string | null;
  endDate: string;
  myStatus?: string | null;
}

interface Props {
  placeId: string;
  missions: Mission[];
}

export default function MissionSubmitBox({ placeId, missions }: Props) {
  const [selected, setSelected] = useState<Mission | null>(missions.length === 1 ? missions[0] : null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [visitedAt, setVisitedAt] = useState(""); // datetime-local value
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (missions.length === 0) return null;

  async function uploadPhoto(files: FileList) {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "missions");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) { const { url } = await res.json(); urls.push(url); }
    }
    setPhotos(p => [...p, ...urls]);
    setUploading(false);
  }

  async function submit() {
    if (!selected) return;
    if (photos.length === 0) { setError("กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป"); return; }
    if (!visitedAt) { setError("กรุณาระบุวันและเวลาที่ไปสถานที่"); return; }
    setSubmitting(true); setError("");
    const res = await fetch(`/api/missions/${selected.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrls: photos, reviewText: text, placeId, visitedAt }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json();
      setError(d.error || "เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  }

  const alreadySubmitted = selected && (selected.myStatus === "SUBMITTED" || selected.myStatus === "APPROVED");

  return (
    <div className="pd-card" style={{ border: "2px solid #fbbf24", background: "linear-gradient(135deg, #fffbeb, #fef9c3)" }}>
      <h2 style={{ color: "#92400e" }}>
        🎯 ภารกิจที่สถานที่นี้
        <span style={{ fontSize: 13, fontWeight: 500, color: "#b45309", marginLeft: 8 }}>Active Mission</span>
      </h2>

      {missions.length > 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {missions.map(m => (
            <button key={m.id} onClick={() => setSelected(m)} style={{
              padding: "8px 12px", borderRadius: 10,
              border: selected?.id === m.id ? "2px solid #f59e0b" : "1.5px solid #fde68a",
              background: selected?.id === m.id ? "#fef3c7" : "white",
              textAlign: "left", cursor: "pointer", fontWeight: 600, fontSize: 13,
            }}>
              🎯 {m.title}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div>
          <div style={{ background: "white", borderRadius: 10, padding: 12, marginBottom: 14, border: "1px solid #fde68a" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e", marginBottom: 4 }}>{selected.title}</div>
            <div style={{ fontSize: 12, color: "#78350f", marginBottom: 8, lineHeight: 1.5 }}>{selected.description}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.rewardPoints > 0 && (
                <span style={{ fontSize: 11, background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                  ⭐ {selected.rewardPoints} แต้ม
                </span>
              )}
              {selected.badgeLabel && (
                <span style={{ fontSize: 11, background: "#fce7f3", color: "#9d174d", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>
                  🏅 {selected.badgeLabel}
                </span>
              )}
              <span style={{ fontSize: 11, color: "#a16207", marginLeft: "auto" }}>
                ถึง {new Date(selected.endDate).toLocaleDateString("th-TH")}
              </span>
            </div>
          </div>

          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#15803d", fontWeight: 700, fontSize: 15 }}>
              ✅ ส่งผลงานสำเร็จ! แอดมินจะตรวจสอบและอนุมัติเร็วๆ นี้
            </div>
          ) : alreadySubmitted ? (
            <div style={{ textAlign: "center", padding: "12px 0", color: "#92400e", fontWeight: 600, fontSize: 13 }}>
              {selected.myStatus === "APPROVED" ? "✅ ผลงานได้รับการอนุมัติแล้ว!" : "⏳ ส่งผลงานแล้ว — รอแอดมินตรวจสอบ"}
            </div>
          ) : (
            <>
              {/* Visit date-time */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                  🕐 วันและเวลาที่ไปสถานที่ *
                </div>
                <input
                  type="datetime-local"
                  value={visitedAt}
                  onChange={e => setVisitedAt(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1.5px solid #fde68a", fontSize: 13,
                    background: "white", color: "#1e293b", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "#a16207", marginTop: 4 }}>
                  ระบุวันเวลาที่คุณไปถึงสถานที่จริง เพื่อให้แอดมินตรวจสอบ
                </div>
              </div>

              {/* Photo upload */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>📸 อัปโหลดรูปหลักฐาน *</div>
                <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={e => e.target.files && uploadPhoto(e.target.files)} />
                <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{
                  width: "100%", padding: "9px", borderRadius: 8,
                  border: "2px dashed #f59e0b", background: "rgba(245,158,11,0.07)",
                  color: "#92400e", fontSize: 12, fontWeight: 700, cursor: uploading ? "wait" : "pointer",
                }}>
                  {uploading ? "⏳ กำลังอัปโหลด..." : "📷 เลือกรูปภาพ (เลือกได้หลายรูป)"}
                </button>
                {photos.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {photos.map((p, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={p} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "2px solid #fde68a" }} />
                        <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))} style={{
                          position: "absolute", top: -4, right: -4, width: 18, height: 18,
                          background: "#ef4444", color: "white", border: "none", borderRadius: "50%",
                          fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>💬 บรรยาย / หมายเหตุ</div>
                <textarea
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="เล่าประสบการณ์การทำภารกิจของคุณ..."
                  style={{ width: "100%", minHeight: 72, padding: "8px 10px", borderRadius: 8,
                    border: "1.5px solid #fde68a", fontSize: 13, resize: "vertical", boxSizing: "border-box",
                    background: "white", color: "#1e293b" }}
                />
              </div>

              {error && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{error}</div>}

              <button onClick={submit} disabled={submitting} style={{
                width: "100%", padding: "11px", borderRadius: 10, border: "none",
                background: "#f59e0b", color: "white",
                fontSize: 14, fontWeight: 800, cursor: submitting ? "wait" : "pointer",
              }}>
                {submitting ? "⏳ กำลังส่ง..." : "📨 ส่งผลงานภารกิจ"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
