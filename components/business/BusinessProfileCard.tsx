"use client";

import Link from "next/link";

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
  const metaItems = [
    phone  ? `📞 ${phone}`  : null,
    lineId ? `💬 ${lineId}` : null,
    "🏢 Business Account",
  ].filter(Boolean) as string[];

  return (
    <div className="biz-card">
      <div className="biz-left">
        {logoUrl
          ? <img src={logoUrl} alt="logo" className="biz-logo" />
          : <div className="biz-logo-fallback">🏢</div>
        }
        <div className="biz-info">
          <h2 className="biz-name">
            {businessName ?? "ธุรกิจของฉัน"}
            {isVerified && <span className="biz-verified">✓ ยืนยันแล้ว</span>}
          </h2>
          <div className="biz-meta">
            {metaItems.map((text, i) => (
              <span key={i} className="biz-meta-group">
                {i > 0 && <span className="biz-sep" aria-hidden="true" />}
                <span className="biz-meta-item">{text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Link href="/business/edit-profile" className="biz-edit-btn">
        <span className="biz-edit-icon"><IconEdit /></span>
        <span className="biz-edit-text">
          <span className="biz-edit-main">แก้ไขโปรไฟล์</span>
          <span className="biz-edit-sub">Edit Profile</span>
        </span>
      </Link>

      <style jsx>{`
        .biz-card {
          background: #fff; border-radius: 28px; border: 1px solid #f1f5f9;
          box-shadow: 0 2px 16px rgba(15,23,42,0.05); padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px; margin-bottom: 24px;
        }
        .biz-left { display: flex; align-items: center; gap: 18px; flex: 1; min-width: 0; }
        .biz-logo { width: 60px; height: 60px; border-radius: 16px; object-fit: cover; flex-shrink: 0; display: block; }
        .biz-logo-fallback {
          width: 60px; height: 60px; border-radius: 16px;
          background: linear-gradient(135deg, #4facfe, #43e97b);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; flex-shrink: 0;
        }
        .biz-info { min-width: 0; flex: 1; }
        .biz-name {
          font-size: 20px; font-weight: 900; color: #0f172a;
          margin: 0 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .biz-verified { margin-left: 8px; font-size: 13px; color: #22c55e; vertical-align: middle; font-weight: 700; }
        .biz-meta { display: flex; align-items: center; flex-wrap: wrap; row-gap: 4px; }
        .biz-meta-group { display: flex; align-items: center; }
        .biz-meta-item { font-size: 13px; color: #64748b; }
        .biz-sep { width: 1px; height: 14px; background: #e2e8f0; margin: 0 10px; flex-shrink: 0; display: inline-block; }
        .biz-edit-btn {
          display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px 10px 10px;
          border-radius: 14px; background: #fff; border: 1.5px solid #dbeafe;
          color: #1d4ed8; text-decoration: none; font-size: 13px; font-weight: 700;
          flex-shrink: 0; white-space: nowrap;
        }
        .biz-edit-icon {
          width: 30px; height: 30px; border-radius: 8px; background: #dbeafe; color: #2563eb;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .biz-edit-text { display: flex; flex-direction: column; gap: 2px; line-height: 1; }
        .biz-edit-main { font-size: 13px; font-weight: 700; color: #1d4ed8; display: block; }
        .biz-edit-sub  { font-size: 10px; color: #60a5fa; display: block; }

        @media (max-width: 600px) {
          .biz-card { padding: 20px; flex-direction: column; align-items: stretch; gap: 14px; }
          .biz-name { white-space: normal; font-size: 18px; }
          .biz-meta { flex-direction: column; align-items: flex-start; gap: 4px; }
          .biz-meta-group { flex-direction: row; }
          .biz-sep { display: none; }
          .biz-edit-btn { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
