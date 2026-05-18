import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BackButton from "@/components/common/BackButton";
import "./place-detail.css";

type Props = { params: Promise<{ slug: string }> };

export default async function PlaceDetailPage({ params }: Props) {
  const { slug } = await params;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      business: {
        select: { id: true, businessName: true, logoUrl: true, isVerified: true, phone: true, website: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } },
        },
      },
      _count: { select: { reviews: true, bookmarks: true } },
    },
  });

  if (!place) return notFound();

  const avgRating = place.reviews.length
    ? place.reviews.reduce((s, r) => s + r.rating, 0) / place.reviews.length
    : 0;
  const ratingStars = Math.round(avgRating);

  return (
    <div className="pd-page">

      {/* ── HERO ── */}
      <div className="pd-hero-wrap">
        <div className="pd-hero">
          <div className="pd-hero-actions">
            <BackButton fallback="/" />
          </div>
          {place.coverUrl
            ? <img src={place.coverUrl} alt={place.title} className="pd-hero-img" />
            : <div className="pd-hero-img" style={{ background: "#e2e8f0" }} />
          }
          <div className="pd-hero-overlay">
            <div className="pd-hero-content">
              <div className="pd-hero-badges">
                {place.category && <span className="pd-badge">{place.category}</span>}
                {place.business?.isVerified && <span className="pd-badge pd-badge-green">✓ Verified</span>}
              </div>
              <h1>{place.title}</h1>
              {place.titleEn && <p className="pd-title-en">{place.titleEn}</p>}
              <div className="pd-hero-meta">
                <span>📍 {place.province} · {place.district}</span>
                {avgRating > 0 && (
                  <span className="pd-rating-pill">
                    {"★".repeat(ratingStars)}{"☆".repeat(5 - ratingStars)}
                    <b>{avgRating.toFixed(1)}</b>
                    <span>({place._count.reviews})</span>
                  </span>
                )}
                {place._count.bookmarks > 0 && (
                  <span className="pd-bm-pill">🔖 {place._count.bookmarks.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="pd-container">
        <div className="pd-layout">

          <div className="pd-main">
            {place.tags?.length > 0 && (
              <div className="pd-tags">
                {place.tags.map(t => <span key={t} className="pd-tag">{t}</span>)}
              </div>
            )}

            {(place.descriptionShort || place.description) && (
              <div className="pd-card">
                <h2>🗒️ เกี่ยวกับสถานที่นี้</h2>
                <p className="pd-description">{place.description || place.descriptionShort}</p>
              </div>
            )}

            {place.gallery?.length > 0 && (
              <div className="pd-card">
                <h2>📸 รูปภาพ</h2>
                <div className="pd-gallery">
                  {place.gallery.map((img, i) => (
                    <div key={i} className={`pd-gal-item ${i === 0 ? "pd-gal-main" : ""}`}>
                      <img src={img} alt={`${place.title} ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {place.googleMapsUrl && (
              <div className="pd-card pd-map-card">
                <h2>🗺️ แผนที่</h2>
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-map-btn">
                  เปิดใน Google Maps
                </a>
              </div>
            )}

            {/* Reviews */}
            {place.reviews.length > 0 && (
              <div className="pd-card">
                <h2>💬 รีวิว ({place._count.reviews})</h2>
                {place.reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6",
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, flexShrink: 0 }}>
                        {(r.author.displayName || r.author.firstName).slice(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.author.displayName || r.author.firstName}</div>
                        <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        {r.comment && <p style={{ margin: "6px 0 0", color: "#374151" }}>{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="pd-sidebar">
            <div className="pd-side-card pd-info-card">
              <div className="pd-side-title">📋 ข้อมูลสำคัญ</div>
              <div className="pd-info-list">
                {place.openHours && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🕐</span>
                    <div><div className="pd-info-label">เวลาเปิด–ปิด</div><div className="pd-info-val">{place.openHours}</div></div>
                  </div>
                )}
                {place.closedDays && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">📅</span>
                    <div><div className="pd-info-label">วันหยุด</div><div className="pd-info-val">{place.closedDays}</div></div>
                  </div>
                )}
                {place.entryFee && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🎟️</span>
                    <div><div className="pd-info-label">ค่าเข้าชม</div><div className="pd-info-val">{place.entryFee}</div></div>
                  </div>
                )}
                {place.phone && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">📞</span>
                    <div><div className="pd-info-label">โทรศัพท์</div><div className="pd-info-val">{place.phone}</div></div>
                  </div>
                )}
                {place.website && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🌐</span>
                    <div>
                      <div className="pd-info-label">เว็บไซต์</div>
                      <a href={place.website} target="_blank" rel="noreferrer" className="pd-info-link">
                        {place.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
                {place.lineId && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">💬</span>
                    <div><div className="pd-info-label">Line</div><div className="pd-info-val">{place.lineId}</div></div>
                  </div>
                )}
              </div>
            </div>

            <div className="pd-side-card">
              <div className="pd-side-title">📍 ที่ตั้ง</div>
              <div className="pd-loc-province">{place.province}</div>
              <div className="pd-loc-district">อ.{place.district}</div>
              {place.address && <div className="pd-loc-address">{place.address}</div>}
              {place.googleMapsUrl && (
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-maps-btn">
                  🗺️ เปิด Google Maps
                </a>
              )}
            </div>

            {place.business && (
              <div className="pd-side-card">
                <div className="pd-side-title">🏢 ธุรกิจ</div>
                <div style={{ fontWeight: 700 }}>{place.business.businessName}</div>
                {place.business.isVerified && <div style={{ color: "#16a34a", fontSize: 13 }}>✓ ธุรกิจที่ยืนยันแล้ว</div>}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
