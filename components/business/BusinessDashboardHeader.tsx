import Link from "next/link";

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const S = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "14px",
    marginBottom: "24px",
  } as React.CSSProperties,

  titleBlock: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  } as React.CSSProperties,

  title: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  titleTag: {
    fontSize: "11px",
    fontWeight: 700,
    background: "#eff6ff",
    color: "#2563eb",
    padding: "3px 10px",
    borderRadius: "6px",
    letterSpacing: "0.3px",
  } as React.CSSProperties,

  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
  } as React.CSSProperties,

  /* ✅ ปุ่มเพิ่มสถานที่ใหม่ — gradient ฟ้า→เขียว inline ทั้งหมด */
  btnAdd: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 22px 11px 12px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #4facfe 0%, #43e97b 100%)",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(79,172,254,0.30)",
    border: "none",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  btnTextWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    textAlign: "left" as const,
    lineHeight: 1,
  } as React.CSSProperties,

  btnMain: {
    fontSize: "13px",
    fontWeight: 900,
    color: "#ffffff",
    display: "block",
  } as React.CSSProperties,

  btnSub: {
    fontSize: "10px",
    fontWeight: 400,
    color: "rgba(255,255,255,0.80)",
    display: "block",
  } as React.CSSProperties,
};

export default function BusinessDashboardHeader() {
  return (
    <div style={S.wrap}>

      <div style={S.titleBlock}>
        <h2 style={S.title}>
          จัดการสถานที่
          <span style={S.titleTag}>Manage Places</span>
        </h2>
        <p style={S.subtitle}>เพิ่ม แก้ไข และจัดการสถานที่ท่องเที่ยวของคุณ</p>
      </div>

      {/* ✅ ปุ่มเพิ่มสถานที่ — pure inline style */}
      <Link href="/business/places/create" style={S.btnAdd}>
        <span style={S.btnIcon}>
          <IconPlus />
        </span>
        <span style={S.btnTextWrap}>
          <span style={S.btnMain}>เพิ่มสถานที่ใหม่</span>
          <span style={S.btnSub}>Add New Place</span>
        </span>
      </Link>

    </div>
  );
}
