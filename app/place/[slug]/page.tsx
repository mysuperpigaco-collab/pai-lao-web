import { notFound } from "next/navigation";
import { mockPlaces } from "@/data/mockPlaces";
import BackButton from "@/components/common/BackButton";
import "./place-detail.css";

type Props = { params: Promise<{ slug: string }> };

export default async function PlaceDetailPage({ params }: Props) {
  const { slug } = await params;
  const place = mockPlaces.find((p) => p.slug === slug);
  if (!place) return notFound();

  const ratingStars = Math.round(place.rating ?? 0);

  return (
    <div className="pd-page">

      {/* ── HERO ── */}
      <div className="pd-hero-wrap">
        <div className="pd-hero">
          <div className="pd-hero-actions">
            <BackButton fallback="/" />
          </div>
          <img src={place.image} alt={place.title} className="pd-hero-img" />
          <div className="pd-hero-overlay">
            <div className="pd-hero-content">
              <div className="pd-hero-badges">
                <span className="pd-badge">{place.category}</span>
                {place.isVerified && <span className="pd-badge pd-badge-green">✓ Verified</span>}
              </div>
              <h1>{place.title}</h1>
              {place.titleEn && <p className="pd-title-en">{place.titleEn}</p>}
              <div className="pd-hero-meta">
                <span>📍 {place.province} · {place.district}</span>
                {place.rating && (
                  <span className="pd-rating-pill">
                    {"★".repeat(ratingStars)}{"☆".repeat(5 - ratingStars)}
                    <b>{place.rating}</b>
                    <span>({(place.ratingCount ?? 0).toLocaleString()})</span>
                  </span>
                )}
                {place.bookmarkCount && (
                  <span className="pd-bm-pill">🔖 {place.bookmarkCount.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="pd-container">
        <div className="pd-layout">

          {/* ── MAIN ── */}
          <div className="pd-main">

            {/* Tags */}
            {place.tags && place.tags.length > 0 && (
              <div className="pd-tags">
                {place.tags.map((t) => <span key={t} className="pd-tag">{t}</span>)}
              </div>
            )}

            {/* Description */}
            <div className="pd-card">
              <h2>🗒️ เกี่ยวกับสถานที่นี้</h2>
              <p className="pd-description">{place.description}</p>
            </div>

            {/* Gallery */}
            {place.gallery.length > 0 && (
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

            {/* Map */}
            {place.googleMapsUrl && (
              <div className="pd-card pd-map-card">
                <h2>🗺️ แผนที่</h2>
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-map-btn">
                  เปิดใน Google Maps
                </a>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="pd-sidebar">

            {/* Quick info */}
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
                      <a href={place.website} target="_blank" rel="noreferrer" className="pd-info-link">{place.website.replace(/^https?:\/\//, "")}</a>
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

            {/* Location */}
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

            {/* Bookmark + Edit */}
            <div className="pd-side-card pd-action-card">
              <button className="pd-bm-button">🔖 บุ๊คมาร์ค</button>
              <a href={`/business/places/${place.slug}/edit`} className="pd-edit-btn">✏️ แก้ไขสถานที่</a>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
