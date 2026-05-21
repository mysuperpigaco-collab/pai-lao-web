"use client";
import Link from "next/link";

export default function PrintTripButton({ slug, title }: { slug: string; title: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Link
        href={`/trips/${slug}/print`}
        target="_blank"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
          background: "#f8fafc", color: "#374151", textDecoration: "none",
          fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center",
        }}>
        🖨️ พิมพ์ / PDF · Print
      </Link>
    </div>
  );
}
