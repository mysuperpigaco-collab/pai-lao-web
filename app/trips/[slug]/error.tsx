"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function TripError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 20px", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
        ไม่สามารถโหลดหน้านี้ได้
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8, maxWidth: 360 }}>
        เกิดข้อผิดพลาดขณะโหลดข้อมูลทริป
      </p>
      {error.message && (
        <pre style={{ fontSize: 11, color: "#475569", background: "#0f172a",
          border: "1px solid #334155", borderRadius: 8, padding: "8px 14px",
          marginBottom: 20, maxWidth: 480, overflowX: "auto", textAlign: "left" }}>
          {error.message}
        </pre>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={unstable_retry}
          style={{ padding: "8px 20px", borderRadius: 8, background: "#2563eb",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
          🔄 ลองอีกครั้ง
        </button>
        <Link href="/trips"
          style={{ padding: "8px 20px", borderRadius: 8, background: "#1e293b",
            color: "#94a3b8", border: "1px solid #334155", fontWeight: 700, fontSize: 14,
            textDecoration: "none" }}>
          ← กลับหน้าทริป
        </Link>
        <Link href="/admin/trips"
          style={{ padding: "8px 20px", borderRadius: 8, background: "#1e293b",
            color: "#94a3b8", border: "1px solid #334155", fontWeight: 700, fontSize: 14,
            textDecoration: "none" }}>
          🗂️ Admin Trips
        </Link>
      </div>
    </div>
  );
}
