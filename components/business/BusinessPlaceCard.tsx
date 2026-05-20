"use client";

import Link from "next/link";

type Props = {
  slug: string;
  title: string;
  province: string;
  district: string;
  coverUrl: string;
  category: string;
  avgRating?: number | null;
  isVerified?: boolean;
  reviewCount?: number;
  bookmarkCount?: number;
  onDeleted?: (slug: string) => void;
};

const CAT_ICON: Record<string, string> = {
  NATURE:"🌿", CAFE:"☕", ACCOMMODATION:"🏨", CAMPING:"⛺",
  FOOD:"🍲", TEMPLE:"🛕", BEACH:"🏖️", MARKET:"🛍️", ADVENTURE:"🧗", MUSEUM:"🏛️",
};

export default function BusinessPlaceCard({
  slug, title, province, district, coverUrl,
  category, avgRating, isVerified, reviewCount, bookmarkCount, onDeleted,
}: Props) {
  const icon = CAT_ICON[category] ?? "📍";

  async function handleDelete() {
    if (!confirm(`ลบสถานที่ "${title}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/places/${slug}`, { method: "DELETE" });
      if (res.ok) onDeleted?.(slug);
      else alert("ไม่สามารถลบได้");
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="bpc-card">
      <div className="bpc-img-wrap">
        {coverUrl
          ? <img src={coverUrl} alt={title} />
          : <div className="bpc-img-placeholder">{icon}</div>
        }
        <div className="bpc-overlay">
          <span className="bpc-cat">{icon} {category}</span>
          {isVerified && <span className="bpc-verified">✓ Verified</span>}
        </div>
      </div>

      <div className="bpc-body">
        <h3 className="bpc-title">{title}</h3>
        <p className="bpc-loc">📍 {province} · {district}</p>
        <div className="bpc-stats">
          {avgRating != null && avgRating > 0 && (
            <span className="bpc-stat">⭐ {avgRating.toFixed(1)}</span>
          )}
          {reviewCount != null && (
            <span className="bpc-stat">💬 {reviewCount} รีวิว</span>
          )}
          {bookmarkCount != null && (
            <span className="bpc-stat">🔖 {bookmarkCount}</span>
          )}
        </div>
      </div>

      <div className="bpc-actions">
        <Link href={`/place/${slug}`} className="bpc-btn bpc-view">ดูหน้าสาธารณะ</Link>
        <Link href={`/business/places/${slug}/edit`} className="bpc-btn bpc-edit">แก้ไข</Link>
        {onDeleted && (
          <button onClick={handleDelete} className="bpc-btn bpc-delete">ลบ</button>
        )}
      </div>

      <style jsx>{`
        .bpc-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          border: 1.5px solid #f1f5f9;
          box-shadow: 0 4px 18px rgba(0,0,0,0.05);
          transition: transform 0.25s, box-shadow 0.25s;
          display: flex;
          flex-direction: column;
        }
        .bpc-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.10);
        }
        .bpc-img-wrap {
          height: 200px;
          position: relative;
          overflow: hidden;
          background: #e2e8f0;
        }
        .bpc-img-wrap img {
          width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s;
        }
        .bpc-card:hover .bpc-img-wrap img { transform: scale(1.05); }
        .bpc-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px;
        }
        .bpc-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          padding: 16px 14px 12px;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .bpc-cat {
          background: rgba(255,255,255,0.18); backdrop-filter: blur(8px);
          color: white; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px;
        }
        .bpc-verified {
          background: rgba(16,185,129,0.35); color: #d1fae5;
          font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 999px;
        }
        .bpc-body {
          padding: 18px 18px 12px;
          flex: 1;
        }
        .bpc-title {
          font-size: 17px; font-weight: 900; color: #0f172a;
          margin-bottom: 5px; line-height: 1.3;
        }
        .bpc-loc {
          font-size: 13px; color: #64748b; margin-bottom: 10px;
        }
        .bpc-stats {
          display: flex; gap: 8px; flex-wrap: wrap;
        }
        .bpc-stat {
          font-size: 12px; font-weight: 700; color: #475569;
          background: #f8fafc; border: 1px solid #e2e8f0;
          padding: 3px 10px; border-radius: 999px;
        }
        .bpc-actions {
          display: flex; gap: 8px; padding: 12px 18px 18px;
          flex-wrap: wrap;
        }
        .bpc-btn {
          flex: 1; text-align: center; padding: 9px 12px;
          border-radius: 12px; font-size: 13px; font-weight: 700;
          text-decoration: none; cursor: pointer;
          border: none; font-family: inherit; transition: 0.2s;
        }
        .bpc-view {
          background: #eff6ff; color: #2563eb;
        }
        .bpc-view:hover { background: #dbeafe; }
        .bpc-edit {
          background: linear-gradient(135deg, #3b82f6, #10b981);
          color: white;
        }
        .bpc-edit:hover { opacity: 0.9; }
        .bpc-delete {
          background: #fff1f2; color: #e11d48;
          flex: 0; padding: 9px 14px;
        }
        .bpc-delete:hover { background: #ffe4e6; }
      `}</style>
    </div>
  );
}
