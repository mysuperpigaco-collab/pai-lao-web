"use client";

import { useState } from "react";

interface ShareButtonProps {
  title: string;
  url?: string;
  tripId?: string;
  placeId?: string;
  initialShareCount?: number;
}

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

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

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
  );
}
