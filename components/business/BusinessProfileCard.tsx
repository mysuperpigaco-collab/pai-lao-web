import Link from "next/link";

type Props = {
  businessName?: string;
  phone?:        string;
  lineId?:       string;
  logoUrl?:      string;
  isVerified?:   boolean;
};

const S = {
  wrap: {
    background: "#ffffff", borderRadius: "28px", border: "1px solid #f1f5f9",
    boxShadow: "0 2px 16px rgba(15,23,42,0.05)", padding: "28px 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap" as const, gap: "20px", marginBottom: "24px",
  } as React.CSSProperties,
  left:      { display: "flex", alignItems: "center", gap: "18px", flex: 1, minWidth: 0 } as React.CSSProperties,
  logoWrap:  { width: "60px", height: "60px", borderRadius: "16px", background: "linear-gradient(135deg, #4facfe, #43e97b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 } as React.CSSProperties,
  logoImg:   { width: "60px", height: "60px", borderRadius: "16px", objectFit: "cover" as const, flexShrink: 0 },
  textBlock: { minWidth: 0 } as React.CSSProperties,
  bizName:   { fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" } as React.CSSProperties,
  metaRow:   { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" as const } as React.CSSProperties,
  metaItem:  { fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px" } as React.CSSProperties,
  metaDivider: { width: "1px", height: "14px", background: "#e2e8f0" } as React.CSSProperties,
  btnEdit: {
    display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 20px 10px 10px",
    borderRadius: "14px", background: "#ffffff", border: "1.5px solid #dbeafe",
    color: "#1d4ed8", textDecoration: "none", fontSize: "13px", fontWeight: 700,
    cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  btnIcon: { width: "30px", height: "30px", borderRadius: "8px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } as React.CSSProperties,
  btnTextWrap: { display: "flex", flexDirection: "column" as const, gap: "2px", lineHeight: 1, textAlign: "left" as const } as React.CSSProperties,
  btnMain: { fontSize: "13px", fontWeight: 700, color: "#1d4ed8", display: "block" } as React.CSSProperties,
  btnSub:  { fontSize: "10px", fontWeight: 400, color: "#60a5fa", display: "block" } as React.CSSProperties,
};

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function BusinessProfileCard({ businessName, phone, lineId, logoUrl, isVerified }: Props) {
  return (
    <div style={S.wrap}>
      <div style={S.left}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={S.logoImg} />
          : <div style={S.logoWrap}>🏢</div>
        }
        <div style={S.textBlock}>
          <h2 style={S.bizName}>
            {businessName ?? "ธุรกิจของฉัน"}
            {isVerified && (
              <span style={{ marginLeft: "8px", fontSize: "13px", color: "#22c55e", verticalAlign: "middle" }}>✓ ยืนยันแล้ว</span>
            )}
          </h2>
          <div style={S.metaRow}>
            {phone  && <><span style={S.metaItem}>📞 {phone}</span><span style={S.metaDivider}/></>}
            {lineId && <><span style={S.metaItem}>💬 {lineId}</span><span style={S.metaDivider}/></>}
            <span style={S.metaItem}>🏢 Business Account</span>
          </div>
        </div>
      </div>
      <Link href="/business/edit-profile" style={S.btnEdit}>
        <span style={S.btnIcon}><IconEdit /></span>
        <span style={S.btnTextWrap}>
          <span style={S.btnMain}>แก้ไขโปรไฟล์</span>
          <span style={S.btnSub}>Edit Profile</span>
        </span>
      </Link>
    </div>
  );
}
