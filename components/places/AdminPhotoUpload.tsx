"use client";
import { useRef, useState } from "react";
import { uploadFile } from "@/lib/uploadHelper";

interface Props {
  placeId: string;
  initialGallery: string[];
  initialCoverUrl: string | null;
  onUpdate: (gallery: string[], coverUrl: string | null) => void;
}

export default function AdminPhotoUpload({ placeId, initialGallery, initialCoverUrl, onUpdate }: Props) {
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [cover, setCover] = useState<string | null>(initialCoverUrl);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file, "places");
        uploaded.push(url);
      } catch {}
    }
    if (uploaded.length === 0) { setUploading(false); return; }

    const res = await fetch("/api/admin/places/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, addPhotos: uploaded }),
    });
    if (res.ok) {
      const { place } = await res.json();
      setGallery(place.gallery);
      onUpdate(place.gallery, place.coverUrl);
    }
    setUploading(false);
  }

  async function removePh(url: string) {
    const res = await fetch("/api/admin/places/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, removePhoto: url }),
    });
    if (res.ok) {
      const { place } = await res.json();
      setGallery(place.gallery);
      if (cover === url) setCover(null);
      onUpdate(place.gallery, place.coverUrl === url ? null : place.coverUrl);
    }
  }

  async function setAsCover(url: string) {
    const res = await fetch("/api/admin/places/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, setCover: url }),
    });
    if (res.ok) {
      setCover(url);
      onUpdate(gallery, url);
    }
  }

  return (
    <div style={{ border: "1.5px dashed #cbd5e1", borderRadius: 14, padding: 16, marginTop: 12, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? 14 : 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          🔧 จัดการรูปภาพ <span style={{ color: "#94a3b8", fontWeight: 500 }}>Admin Photo Manager</span>
        </span>
        <button onClick={() => setOpen(o => !o)} style={{
          background: "#0f766e", color: "white", border: "none", borderRadius: 8,
          padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          {open ? "ซ่อน" : "จัดการรูปภาพ"}
        </button>
      </div>

      {open && (
        <>
          {/* Upload button */}
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={e => e.target.files && upload(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              width: "100%", padding: "10px", borderRadius: 10,
              border: "2px dashed #0f766e", background: "rgba(15,118,110,0.06)",
              color: "#0f766e", fontSize: 13, fontWeight: 700, cursor: uploading ? "wait" : "pointer",
              marginBottom: 14,
            }}
          >
            {uploading ? "⏳ กำลังอัปโหลด..." : "📸 อัปโหลดรูปภาพ (เลือกได้หลายรูป)"}
          </button>

          {/* Gallery grid */}
          {gallery.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {gallery.map((img, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden",
                  border: cover === img ? "2.5px solid #0f766e" : "2px solid #e2e8f0" }}>
                  <img src={img} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                  {cover === img && (
                    <span style={{ position: "absolute", top: 4, left: 4, background: "#0f766e",
                      color: "white", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>
                      ปก
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 3, padding: "4px 4px" }}>
                    <button onClick={() => setAsCover(img)} style={{
                      flex: 1, fontSize: 9, padding: "3px 0", borderRadius: 5,
                      border: "none", background: "#0f766e", color: "white", cursor: "pointer", fontWeight: 700,
                    }}>
                      ตั้งเป็นปก
                    </button>
                    <button onClick={() => removePh(img)} style={{
                      fontSize: 9, padding: "3px 6px", borderRadius: 5,
                      border: "none", background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontWeight: 700,
                    }}>
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "8px 0" }}>
              ยังไม่มีรูปภาพ — อัปโหลดเพื่อเพิ่มในแกลอรี
            </p>
          )}
        </>
      )}
    </div>
  );
}
