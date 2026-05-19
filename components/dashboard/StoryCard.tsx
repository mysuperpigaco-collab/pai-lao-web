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
  published: { text: "เผยแพร่แล้ว", en: "Published", color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  draft:     { text: "ฉบับร่าง",     en: "Draft",     color: "#475569", bg: "#f1f5f9", dot: "#94a3b8" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

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
  const [confirm,  setConfirm ] = useState(false);
  const s = STATUS_MAP[story.isPublished !== false ? "published" : "draft"];

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${story.slug}`, { method: "DELETE" });
      if (res.ok) { onDeleted?.(story.slug); }
      else { const d = await res.json(); alert(d.message || "ลบไม่สำเร็จ"); setDeleting(false); setConfirm(false); }
    } catch { alert("ไม่สามารถเชื่อมต่อระบบได้"); setDeleting(false); setConfirm(false); }
  };

  const imgSrc = story.coverUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800";

  return (
    <div className="sc-card" style={{ opacity: deleting ? 0.5 : 1 }}>
      <div className="sc-img-wrap">
        <img src={imgSrc} alt={story.title} className="sc-img" loading="lazy" />
        <span className="sc-badge" style={{ background: s.bg, color: s.color }}>
          <span className="sc-dot" style={{ background: s.dot }} />
          {s.text} · {s.en}
        </span>
      </div>

      <div className="sc-body">
        <h4 className="sc-title">{story.title}</h4>
        <p className="sc-date">📅 {formatDate(story.createdAt)}</p>

        <div className="sc-actions">
          <Link href={`/trips/${story.slug}`} className="sc-btn sc-view">
            <IconEye />
            <span className="sc-btn-text"><span>ดู</span><small>View</small></span>
          </Link>
          {isOwner && (
            <>
              <Link href={`/trips/${story.slug}/edit`} className="sc-btn sc-edit">
                <IconEdit />
                <span className="sc-btn-text"><span>แก้ไข</span><small>Edit</small></span>
              </Link>
              {confirm ? (
                <div className="sc-confirm-row">
                  <button className="sc-btn sc-del-confirm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "⏳" : "ยืนยันลบ"}
                  </button>
                  <button className="sc-btn sc-cancel" onClick={() => setConfirm(false)}>ยกเลิก</button>
                </div>
              ) : (
                <button className="sc-btn sc-del" onClick={handleDelete} title="ลบเรื่องเล่า · Delete">
                  <IconTrash />
                  <span className="sc-btn-text"><span>ลบ</span><small>Delete</small></span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .sc-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; transition: 0.25s ease; box-shadow: 0 2px 12px rgba(15,23,42,0.04); }
        .sc-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15,23,42,0.09); }

        .sc-img-wrap { position: relative; height: 180px; background: #f1f5f9; overflow: hidden; }
        .sc-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s; }
        .sc-card:hover .sc-img { transform: scale(1.04); }

        .sc-badge { position: absolute; top: 10px; right: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; backdrop-filter: blur(6px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .sc-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .sc-body { padding: 16px 18px 18px; }
        .sc-title { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0 0 5px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sc-date { font-size: 12px; color: #94a3b8; margin: 0 0 14px; }

        .sc-actions { display: flex; gap: 6px; }
        .sc-btn { flex: 1; padding: 8px 6px; border-radius: 10px; border: 1.5px solid #f1f5f9; background: white; cursor: pointer; transition: 0.18s; text-align: center; text-decoration: none; color: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: inherit; }
        .sc-btn-text { display: flex; flex-direction: column; gap: 1px; line-height: 1; }
        .sc-btn-text span { font-size: 12px; font-weight: 700; }
        .sc-btn-text small { font-size: 9px; font-weight: 400; opacity: 0.65; }

        .sc-view { color: #334155; }
        .sc-view:hover { background: #f8fafc; border-color: #e2e8f0; }

        .sc-edit { color: #2563eb; border-color: #dbeafe; background: #f8fbff; }
        .sc-edit:hover { background: #eff6ff; }

        .sc-del { color: #dc2626; border-color: #fecaca; background: #fff8f8; }
        .sc-del:hover { background: #fef2f2; }

        .sc-confirm-row { display: flex; gap: 4px; flex: 2; }
        .sc-del-confirm { flex: 1; font-size: 11px; font-weight: 800; color: #fff; background: #dc2626; border-color: #dc2626; padding: 6px 4px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; }
        .sc-cancel { flex: 1; font-size: 11px; font-weight: 700; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 4px; border-radius: 8px; cursor: pointer; font-family: inherit; }
      `}</style>
    </div>
  );
}
