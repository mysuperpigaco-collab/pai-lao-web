"use client";

import Link from "next/link";
import { useState, useEffect, Fragment } from "react";

type Props = {
  businessName?: string;
  phone?:        string;
  lineId?:       string;
  logoUrl?:      string;
  isVerified?:   boolean;
};

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function BusinessProfileCard({ businessName, phone, lineId, logoUrl, isVerified }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const metaItems = [
    phone  ? `📞 ${phone}`  : null,
    lineId ? `💬 ${lineId}` : null,
    "🏢 Business Account",
  ].filter(Boolean) as string[];

  return (
    <div style={{
      background: "var(--pl-white)", borderRadius: "28px", border: "1px solid var(--pl-border)",
      boxShadow: "var(--pl-shadow-card)",
      padding: isMobile ? "20px" : "28px 32px",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      justifyContent: "space-between",
      gap: isMobile ? "14px" : "20px",
      marginBottom: "24px",
    }}>

      {/* Left: logo + info */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, minWidth: 0 }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width: 60, height: 60, borderRadius: 16, objectFit: "cover", flexShrink: 0, display: "block" }} />
          : <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#4facfe,#43e97b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🏢</div>
        }
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{
            fontSize: isMobile ? "18px" : "20px", fontWeight: 900, color: "var(--pl-text-primary)",
            margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: isMobile ? "normal" : "nowrap",
          }}>
            {businessName ?? "ธุรกิจของฉัน"}
            {isVerified && <span style={{ marginLeft: 8, fontSize: 13, color: "#22c55e", verticalAlign: "middle", fontWeight: 700 }}>✓ ยืนยันแล้ว</span>}
          </h2>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 4 }}>
            {metaItems.map((text, i) => (
              <Fragment key={i}>
                {i > 0 && <span style={{ width: 1, height: 14, background: "var(--pl-border)", margin: "0 10px", flexShrink: 0, display: "inline-block" }} />}
                <span style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>{text}</span>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Edit button */}
      <Link href="/business/edit-profile" style={{
        display: "inline-flex", alignItems: "center", justifyContent: isMobile ? "center" : undefined,
        gap: "10px", padding: "10px 20px 10px 10px",
        borderRadius: "14px", background: "#ffffff", border: "1.5px solid #dbeafe",
        color: "#1d4ed8", textDecoration: "none", fontSize: "13px", fontWeight: 700,
        cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconEdit />
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1, textAlign: "left" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8", display: "block" }}>แก้ไขโปรไฟล์</span>
          <span style={{ fontSize: 10, color: "#60a5fa", display: "block" }}>Edit Profile</span>
        </span>
      </Link>

    </div>
  );
}
