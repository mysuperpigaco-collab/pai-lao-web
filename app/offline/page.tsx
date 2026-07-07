"use client";

// หน้า fallback ตอนออฟไลน์ (service worker เสิร์ฟหน้านี้เมื่อโหลดหน้าใหม่ไม่ได้)
export default function OfflinePage() {
  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center",
      padding: "40px 24px", gap: 12,
    }}>
      <div style={{ fontSize: 52 }}>📡</div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: 0 }}>
        ออฟไลน์อยู่ตอนนี้
      </h1>
      <p style={{ fontSize: 14, color: "var(--pl-text-secondary)", margin: 0, maxWidth: 360, lineHeight: 1.7 }}>
        เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองเช็คสัญญาณแล้วกดลองใหม่อีกครั้ง
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8, padding: "12px 32px", borderRadius: 999, border: "none",
          background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
          fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        ลองใหม่
      </button>
    </div>
  );
}
