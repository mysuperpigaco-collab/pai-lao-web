"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/* ─── Types ─────────────────────────────────────── */
interface ProfileData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
  bio: string | null;
  gender: string | null;
  avatarUrl: string | null;
  role: string;
}

/* ─── Helpers ────────────────────────────────────── */
const GENDER_OPTS = [
  { value: "", label: "ไม่ระบุ" },
  { value: "MALE", label: "ชาย" },
  { value: "FEMALE", label: "หญิง" },
  { value: "OTHER", label: "อื่นๆ" },
];

function Field({
  label, name, value, onChange, type = "text", readOnly = false,
}: {
  label: string; name: string; value: string; onChange?: (v: string) => void;
  type?: string; readOnly?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className="adm-input"
        style={{
          minWidth: "unset",
          width: "100%",
          boxSizing: "border-box",
          opacity: readOnly ? 0.5 : 1,
          cursor: readOnly ? "not-allowed" : undefined,
        }}
      />
    </div>
  );
}

function TextArea({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{
          background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
          padding: "7px 12px", color: "#f1f5f9", fontSize: "0.82rem",
          outline: "none", resize: "vertical", fontFamily: "inherit",
          transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target.style.borderColor = "#4facfe")}
        onBlur={e => (e.target.style.borderColor = "#334155")}
      />
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */
export default function AdminProfilePage() {
  const { refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* form fields */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone]         = useState("");
  const [bio, setBio]             = useState("");
  const [gender, setGender]       = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  /* password */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);

  /* ── Load ── */
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        const u: ProfileData = d.user;
        setProfile(u);
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setDisplayName(u.displayName ?? "");
        setPhone(u.phone ?? "");
        setBio(u.bio ?? "");
        setGender(u.gender ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── Avatar upload ── */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    /* client-side resize */
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise(res => (img.onload = res));
    const size = Math.min(img.width, img.height, 400);
    canvas.width = size; canvas.height = size;
    const cx = canvas.getContext("2d")!;
    const ox = (img.width - size) / 2;
    const oy = (img.height - size) / 2;
    cx.drawImage(img, ox, oy, size, size, 0, 0, size, size);
    URL.revokeObjectURL(url);

    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.88));
    const form = new FormData();
    form.append("file", blob, "avatar.jpg");
    form.append("folder", "avatars");

    setUploading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        showToast("success", "อัปโหลดรูปสำเร็จ");
      } else {
        showToast("error", data.message || "อัปโหลดล้มเหลว");
      }
    } catch {
      showToast("error", "อัปโหลดล้มเหลว");
    } finally {
      setUploading(false);
    }
  }

  /* ── Save profile ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPw && newPw !== confirmPw) {
      showToast("error", "รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        firstName, lastName, displayName, phone, bio,
        gender: gender || "",
        avatarUrl,
      };
      if (newPw) { body.currentPw = currentPw; body.newPw = newPw; }

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.message || "บันทึกล้มเหลว"); return; }

      showToast("success", "บันทึกสำเร็จ");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      await refresh();
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#64748b" }}>
      กำลังโหลด...
    </div>
  );

  const roleLabel = profile?.role === "SUPERADMIN" ? "⚡ Superadmin" : "🛡️ Admin";
  const roleColor = profile?.role === "SUPERADMIN" ? "#f59e0b" : "#4facfe";
  const initials  = (firstName[0] || profile?.username[0] || "A").toUpperCase();

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: toast.type === "success" ? "#166534" : "#991b1b",
          color: "#fff", borderRadius: 10, padding: "10px 18px",
          fontSize: "0.82rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
          โปรไฟล์ของฉัน
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4 }}>
          จัดการข้อมูลส่วนตัวและรหัสผ่านของบัญชีแอดมิน
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Avatar + identity card */}
        <div className="adm-card" style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: avatarUrl ? "transparent" : "linear-gradient(135deg,#2563eb,#4facfe)",
                  overflow: "hidden", cursor: "pointer", position: "relative",
                  border: "3px solid #334155",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", color: "#fff", fontWeight: 800,
                }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials
                }
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transition: "opacity 0.2s",
                  fontSize: "0.7rem", color: "#fff", fontWeight: 700,
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                >
                  {uploading ? "⏳" : "📷"}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>

            {/* Identity info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f1f5f9" }}>
                  {displayName || firstName || profile?.username}
                </span>
                <span style={{
                  background: roleColor + "22", color: roleColor,
                  borderRadius: 99, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700,
                }}>
                  {roleLabel}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
                @{profile?.username} · {profile?.email}
              </div>
              <button
                type="button"
                className="adm-btn ghost sm"
                style={{ marginTop: 12 }}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "⏳ กำลังอัปโหลด..." : "📷 เปลี่ยนรูปโปรไฟล์"}
              </button>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">ข้อมูลส่วนตัว</span>
          </div>
          <div className="adm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              <Field label="ชื่อจริง *" name="firstName" value={firstName} onChange={setFirstName} />
              <Field label="นามสกุล" name="lastName" value={lastName} onChange={setLastName} />
              <Field label="ชื่อที่แสดง" name="displayName" value={displayName} onChange={setDisplayName} />
              <Field label="เบอร์โทรศัพท์" name="phone" value={phone}
                onChange={v => { if (/^\d*$/.test(v) && v.length <= 10) setPhone(v); }} />

              {/* gender */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  เพศ
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="adm-select"
                  style={{ width: "100%" }}
                >
                  {GENDER_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* read-only */}
              <Field label="Username (ไม่สามารถเปลี่ยนได้)" name="username" value={profile?.username ?? ""} readOnly />
              <Field label="อีเมล (ไม่สามารถเปลี่ยนได้)" name="email" value={profile?.email ?? ""} type="email" readOnly />
            </div>

            <div style={{ marginTop: 16 }}>
              <TextArea label="Bio / แนะนำตัว" value={bio} onChange={setBio} />
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="adm-card">
          <div className="adm-card-head">
            <span className="adm-card-title">เปลี่ยนรหัสผ่าน</span>
          </div>
          <div className="adm-card-body">
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 16px" }}>
              ปล่อยว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {/* wrapper for show/hide toggle */}
              {[
                { label: "รหัสผ่านปัจจุบัน", val: currentPw, set: setCurrentPw },
                { label: "รหัสผ่านใหม่", val: newPw, set: setNewPw },
                { label: "ยืนยันรหัสผ่านใหม่", val: confirmPw, set: setConfirmPw },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPw ? "text" : "password"}
                        value={val}
                        onChange={e => set(e.target.value)}
                        className="adm-input"
                        style={{ minWidth: "unset", width: "100%", boxSizing: "border-box", paddingRight: 36 }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        style={{
                          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer",
                          color: "#64748b", fontSize: "0.9rem", padding: "2px 4px",
                        }}
                        tabIndex={-1}
                      >
                        {showPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="submit"
            className="adm-btn primary"
            disabled={saving || uploading}
            style={{ padding: "9px 28px", fontSize: "0.85rem" }}
          >
            {saving ? "⏳ กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}
