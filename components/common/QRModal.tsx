"use client";

import { useEffect, useRef } from "react";
import QRCode from "react-qr-code";

export default function QRModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div ref={ref} style={{
        background: "#fff", borderRadius: 24, padding: "28px 32px",
        textAlign: "center", boxShadow: "0 24px 64px rgba(15,23,42,0.2)",
        maxWidth: 320, width: "100%",
      }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#1e293b", marginBottom: 4 }}>
          📲 QR Code
        </div>
        <div style={{
          fontSize: 13, color: "#64748b", marginBottom: 20,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </div>

        <div style={{
          background: "#fff", padding: 16, borderRadius: 16,
          border: "1.5px solid #f1f5f9", display: "inline-block",
          boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}>
          <QRCode value={url} size={200} />
        </div>

        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 12, wordBreak: "break-all", lineHeight: 1.5 }}>
          {url}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px", borderRadius: 12,
            border: "1.5px solid #e2e8f0", background: "#f8fafc",
            color: "#475569", fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
