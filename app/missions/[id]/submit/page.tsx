"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/uploadHelper";

export default function SubmitMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files.slice(0, 5)) {
      try { urls.push(await uploadFile(file, "missions")); } catch {}
    }
    setPhotos(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (photos.length === 0) { alert("กรุณาอัปโหลดรูปอย่างน้อย 1 รูป"); return; }
    setSubmitting(true);
    const res = await fetch(`/api/missions/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrls: photos, reviewText }),
    });
    if (res.ok) setDone(true);
    else { const d = await res.json(); alert(d.error || "เกิดข้อผิดพลาด"); }
    setSubmitting(false);
  };

  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ textAlign: "center", background: "#fff", padding: "48px 32px", borderRadius: "24px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>ส่งผลงานสำเร็จ!</h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>รอแอดมินตรวจสอบและยืนยัน</p>
        <button onClick={() => router.push("/missions")} style={{ padding: "12px 32px", background: "linear-gradient(135deg,#2563eb,#10b981)", color: "#fff", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "14px" }}>กลับหน้าภารกิจ</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 16px" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>← กลับ</button>
        <div style={{ background: "#fff", borderRadius: "24px", padding: "28px 24px", boxShadow: "0 4px 24px rgba(15,23,42,0.06)" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 20px" }}>ส่งผลงานภารกิจ</h1>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "13px", color: "#374151", marginBottom: "8px" }}>รูปภาพ (สูงสุด 5 รูป) *</label>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", border: "2px dashed #e2e8f0", borderRadius: "12px", cursor: uploading ? "wait" : "pointer", color: "#64748b", fontSize: "13px" }}>
              {uploading ? "กำลังอัปโหลด..." : "📸 เลือกรูปภาพ"}
              <input hidden type="file" accept="image/*" multiple onChange={handlePhotos} disabled={uploading} />
            </label>
            {photos.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                {photos.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={url} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "2px solid #e2e8f0" }} />
                    <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontSize: "10px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontWeight: 700, fontSize: "13px", color: "#374151", marginBottom: "8px" }}>ความรู้สึก / รีวิว (ไม่บังคับ)</label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="เล่าประสบการณ์ของคุณ..." rows={4} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "14px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <button onClick={handleSubmit} disabled={submitting || uploading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#2563eb,#10b981)", color: "#fff", borderRadius: "14px", fontWeight: 800, fontSize: "15px", border: "none", cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "กำลังส่ง..." : "ส่งผลงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
