"use client";

import Link from "next/link";
import { useState } from "react";

interface TripItem {
  slug:        string;
  title:       string;
  coverUrl?:   string | null;
  createdAt:   string;
  isPublished?: boolean;
}

const STATUS_MAP = {
  published: { text: "เผยแพร่แล้ว · Published", color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  draft:     { text: "ฉบับร่าง · Draft",         color: "#475569", bg: "#f1f5f9", dot: "#94a3b8" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function StoryCard({
  story,
  isOwner,
  onDeleted,
}: {
  story:      TripItem;
  isOwner:    boolean;
  onDeleted?: (slug: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const s = STATUS_MAP[story.isPublished !== false ? "published" : "draft"];

  const handleDelete = async () => {
    if (!confirm(`ลบเรื่อง "${story.title}" ออกจากระบบใช่ไหม?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${story.slug}`, { method: "DELETE" });
      if (res.ok) { onDeleted?.(story.slug); }
      else { const d = await res.json(); alert(d.message || "ลบไม่สำเร็จ"); setDeleting(false); }
    } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); setDeleting(false); }
  };

  const imgSrc = story.coverUrl
    || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800";

  return (
    <div className="sc-card" style={{ opacity: deleting ? 0.5 : 1 }}>
      <div className="sc-img-wrap">
        <img src={imgSrc} alt={story.title} className="sc-img" loading="lazy" />
        <span className="sc-badge" style={{ background: s.bg, color: s.color }}>
          <span className="sc-dot" style={{ background: s.dot }} />
          {s.text}
        </span>
      </div>

      <div className="sc-body">
        <h4 className="sc-title">{story.title}</h4>
        <p className="sc-date">📅 {formatDate(story.createdAt)}</p>

        <div className="sc-actions">
          <Link href={`/trips/${story.slug}`} className="sc-btn sc-view">👁 ดู</Link>
          {isOwner && (
            <>
              <Link href={`/trips/${story.slug}/edit`} className="sc-btn sc-edit">✏️ แก้ไข</Link>
              <button className="sc-btn sc-del" onClick={handleDelete} disabled={deleting}>
                {deleting ? "⏳" : "🗑"}
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .sc-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; position: relative; transition: 0.25s ease; box-shadow: 0 2px 12px rgba(15,23,42,0.04); }
        .sc-card:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(15,23,42,0.08); }

        .sc-img-wrap { position: relative; height: 190px; background: #f1f5f9; overflow: hidden; }
        .sc-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s; }
        .sc-card:hover .sc-img { transform: scale(1.04); }

        .sc-badge { position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; backdrop-filter: blur(6px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .sc-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        .sc-body { padding: 20px 22px; }
        .sc-title { font-size: 16px; font-weight: 800; color: #1e293b; margin: 0 0 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-date { font-size: 12px; color: #94a3b8; margin: 0 0 16px; }

        .sc-actions { display: flex; gap: 8px; }
        .sc-btn { flex: 1; padding: 9px 8px; border-radius: 10px; border: 1px solid #f1f5f9; background: white; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; white-space: nowrap; text-align: center; text-decoration: none; color: inherit; display: inline-flex; align-items: center; justify-content: center; }
        .sc-view:hover { background: #f8fafc; }
        .sc-edit { color: #2563eb; }
        .sc-edit:hover { background: #eff6ff; border-color: #dbeafe; }
        .sc-del { color: #dc2626; flex: 0 0 40px; }
        .sc-del:hover { background: #fef2f2; border-color: #fecaca; }
        .sc-del:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
