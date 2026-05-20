"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    secret: "", firstName: "Admin", lastName: "PaiLao",
    username: "superadmin", email: "", phone: "0800000000", password: "",
  });
  const [msg, setMsg]       = useState("");
  const [ok, setOk]         = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Seed-Secret": form.secret },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          username: form.username, email: form.email,
          phone: form.phone, password: form.password,
        }),
      });
      const d = await res.json();
      if (res.ok) { setOk(true); setMsg("✅ " + d.message); }
      else         { setMsg("❌ " + (d.message || "เกิดข้อผิดพลาด")); }
    } catch (e: any) {
      setMsg("❌ " + e.message);
    }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width:"100%", background:"#0f172a", border:"1px solid #334155",
    borderRadius:8, padding:"9px 12px", color:"#f1f5f9", fontSize:"0.88rem",
    outline:"none", marginBottom:2,
  };
  const lbl: React.CSSProperties = { display:"block", color:"#94a3b8", fontSize:"0.75rem", marginBottom:5, marginTop:14 };

  return (
    <div style={{ background:"#0f172a", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:16, padding:32, width:"100%", maxWidth:440 }}>
        <div style={{ fontSize:"1.2rem", fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>⚡ สร้าง Superadmin</div>
        <div style={{ color:"#64748b", fontSize:"0.8rem", marginBottom:24 }}>ใช้ครั้งเดียวเพื่อสร้างบัญชี Superadmin คนแรก</div>

        {ok ? (
          <div>
            <div style={{ background:"#14402a", color:"#6ee7b7", borderRadius:8, padding:"14px 16px", fontSize:"0.85rem", marginBottom:20, lineHeight:1.6 }}>{msg}</div>
            <button onClick={() => router.push("/login")}
              style={{ width:"100%", padding:12, background:"linear-gradient(to right,#4facfe,#43e97b)", border:"none", borderRadius:10, color:"#0f172a", fontWeight:700, fontSize:"0.95rem", cursor:"pointer" }}>
              ไปหน้า Login →
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={lbl}>Seed Secret (ที่ตั้งใน Vercel env)</label>
            <input style={inp} type="password" placeholder="PaiLaoAdmin2025" value={form.secret} onChange={e => set("secret", e.target.value)} required />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={lbl}>First Name</label>
                <input style={inp} type="text" value={form.firstName} onChange={e => set("firstName", e.target.value)} required />
              </div>
              <div>
                <label style={lbl}>Last Name</label>
                <input style={inp} type="text" value={form.lastName} onChange={e => set("lastName", e.target.value)} required />
              </div>
            </div>

            <label style={lbl}>Username</label>
            <input style={inp} type="text" value={form.username} onChange={e => set("username", e.target.value)} required />

            <label style={lbl}>Email</label>
            <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} required />

            <label style={lbl}>Phone</label>
            <input style={inp} type="text" value={form.phone} onChange={e => set("phone", e.target.value)} required />

            <label style={lbl}>Password (รหัสสำหรับ login)</label>
            <input style={inp} type="password" placeholder="ตั้งรหัสผ่านที่ต้องการ" value={form.password} onChange={e => set("password", e.target.value)} required />

            {msg && (
              <div style={{ background:"#450a0a", color:"#fca5a5", borderRadius:8, padding:"10px 14px", fontSize:"0.82rem", marginTop:14 }}>{msg}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop:22, width:"100%", padding:12, background:"linear-gradient(to right,#4facfe,#43e97b)", border:"none", borderRadius:10, color:"#0f172a", fontWeight:700, fontSize:"0.95rem", cursor: loading?"default":"pointer", opacity: loading?0.6:1 }}>
              {loading ? "กำลังสร้าง..." : "สร้าง Superadmin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
