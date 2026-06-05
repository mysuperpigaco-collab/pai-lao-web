import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>🗺️</div>
        <h1 style={{ fontSize: 72, fontWeight: 900, color: "#10b981", margin: "0 0 8px", lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>หาหน้านี้ไม่เจอ</h2>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: "0 0 32px" }}>
          หน้าที่คุณกำลังมองหาอาจถูกลบ ย้าย หรือไม่มีอยู่<br />
          <span style={{ fontSize: 13 }}>The page you're looking for doesn't exist.</span>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ padding: "12px 28px", background: "#10b981", color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
            กลับหน้าหลัก
          </Link>
          <Link href="/trips" style={{ padding: "12px 28px", background: "white", color: "#475569", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14, border: "1.5px solid #e2e8f0" }}>
            ดูทริปทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}
