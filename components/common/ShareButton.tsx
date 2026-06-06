"use client";

import { useState } from "react";
import QRModal from "./QRModal";

interface ShareButtonProps {
  title: string;
  url?: string;
  tripId?: string;
  placeId?: string;
  initialShareCount?: number;
}

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

const QRIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
    <path d="M14 14h3M14 18h3M17 14v7M21 14v3M21 21h-4"/>
  </svg>
);

export default function ShareButton({
  title,
  url,
  tripId,
  placeId,
  initialShareCount = 0,
}: ShareButtonProps) {
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;

  async function trackShare() {
    try {
      const body = tripId ? { tripId } : { placeId };
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setShareCount(data.shareCount);
      }
    } catch {
      // silently ignore tracking errors
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);

    try {
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        await trackShare();
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        await trackShare();
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled share or clipboard failed — don't track
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <button onClick={handleShare} className="share-btn" disabled={sharing}>
        <span className="share-btn-icon">
          {copied ? "✓" : "↗"}
        </span>
        <span className="share-btn-text">
          {copied ? "คัดลอกลิงก์แล้ว · Copied!" : "แชร์ · Share"}
        </span>
        {shareCount > 0 && (
          <span className="share-btn-count">{shareCount.toLocaleString()}</span>
        )}
        <style jsx>{`
          .share-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 16px;
            border-radius: 14px;
            border: 1.5px solid #e2e8f0;
            background: white;
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            cursor: pointer;
            transition: background 0.2s, border-color 0.2s, color 0.2s;
            font-family: inherit;
          }
          .share-btn:hover:not(:disabled) {
            background: #eff6ff;
            border-color: #bfdbfe;
            color: #2563eb;
          }
          .share-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .share-btn-icon {
            font-size: 16px;
            font-weight: 900;
          }
          .share-btn-text {
            flex: 1;
            text-align: left;
          }
          .share-btn-count {
            background: #f1f5f9;
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 999px;
            min-width: 24px;
            text-align: center;
          }
        `}</style>
      </button>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackShare()}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 7, padding: "11px 12px", borderRadius: 12, background: "#06C755",
            color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 13,
            border: "none", cursor: "pointer",
          }}
        >
          <LineIcon /> LINE
        </a>
        <button
          onClick={() => setShowQR(true)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 7, padding: "11px 12px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", background: "#f8fafc",
            color: "#475569", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <QRIcon /> QR
        </button>
      </div>

      {showQR && <QRModal url={shareUrl} title={title} onClose={() => setShowQR(false)} />}
    </>
  );
}
