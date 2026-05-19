import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PlaceReviews from "@/components/places/PlaceReviews";
import "./place-detail.css";

type Props = { params: Promise<{ slug: string }> };

const CAT_LABEL: Record<string, string> = {
  NATURE: "ธรรมชาติ · Nature", CAFE: "คาเฟ่ · Café",
  ACCOMMODATION: "ที่พัก · Stay", CAMPING: "แคมปิ้ง · Camping",
  FOOD: "อาหาร · Food", TEMPLE: "วัด · Temple",
  BEACH: "ชายหาด · Beach", MARKET: "ตลาด · Market",
  ADVENTURE: "ผจญภัย · Adventure", MUSEUM: "พิพิธภัณฑ์ · Museum",
};
const CAT_ICON: Record<string, string> = {
  NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",
  FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️",
};

export default async function PlaceDetailPage({ params }: Props) {
  const { slug } = await params;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      business: {
        select: {
          id: true, businessName: true, logoUrl: true,
          isVerified: true, phone: true, website: true, userId: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      _count: { select: { reviews: true, bookmarks: true } },
    },
  });

  if (!place) return notFound();

  const session = await getCurrentUser();
  const avgRating = place.reviews.length
    ? place.reviews.reduce((s, r) => s + r.rating, 0) / place.reviews.length
    : 0;
  const ratingStars = Math.round(avgRating);
  const catLabel = CAT_LABEL[place.category] ?? place.category;
  const catIcon  = CAT_ICON[place.category]  ?? "📍";
  const isOwner  = session?.userId === place.business?.userId;

  return (
    <div className="pd-page">

      {/* ── Hero ── */}
      <div className="pd-hero-wrap">
        <div className="pd-hero">
          <div className="pd-hero-actions">
            <Link href="/" className="floating-back-btn">
              <span className="icon-circle">←</span>
              <span>กลับหน้าหลัก · Home</span>
            </Link>
          </div>

          {place.coverUrl
            ? <img src={place.coverUrl} alt={place.title} className="pd-hero-img" />
            : <div className="pd-hero-img" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }} />
          }
          <div className="pd-hero-overlay">
            <div className="pd-hero-content">
              <div className="pd-hero-badges">
                <span className="pd-badge">{catIcon} {catLabel}</span>
                {place.business?.isVerified && (
                  <span className="pd-badge pd-badge-green">✓ Verified Business</span>
                )}
                {isOwner && (
                  <span className="pd-badge" style={{ background: "rgba(245,158,11,0.7)", borderColor: "rgba(245,158,11,0.5)" }}>
                    🏢 Your Place
                  </span>
                )}
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
                  <span className="pd-bm-pill">🔖 {place._count.bookmarks.toLocaleString()} Saved</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="pd-container">
        <div className="pd-layout">

          {/* ── Main ── */}
          <div className="pd-main">
            {place.tags?.length > 0 && (
              <div className="pd-tags">
                {place.tags.map(t => <span key={t} className="pd-tag">{t}</span>)}
              </div>
            )}

            {place.description && (
              <div className="pd-card">
                <h2>🗒️ เกี่ยวกับสถานที่นี้ <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>About this place</span></h2>
                <p className="pd-description">{place.description}</p>
              </div>
            )}

            {place.gallery?.length > 0 && (
              <div className="pd-card">
                <h2>📸 รูปภาพ <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Gallery</span></h2>
                <div className="pd-gallery">
                  {place.gallery.slice(0, 5).map((img, i) => (
                    <div key={i} className={`pd-gal-item${i === 0 ? " pd-gal-main" : ""}`}>
                      <img src={img} alt={`${place.title} ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {place.googleMapsUrl && (
              <div className="pd-card pd-map-card">
                <h2>🗺️ แผนที่ <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Map</span></h2>
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-map-btn">
                  🗺️ เปิดใน Google Maps · Open Maps
                </a>
              </div>
            )}

            {/* Reviews — client component handles write + owner reply */}
            <div className="pd-card">
              <h2>
                💬 รีวิว
                {place._count.reviews > 0 && <span style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}> ({place._count.reviews})</span>}
                <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}> Reviews</span>
              </h2>
              <PlaceReviews
                placeId={place.id}
                businessOwnerId={place.business?.userId ?? null}
                initialReviews={place.reviews}
                avgRating={avgRating}
              />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="pd-sidebar">

            {/* Stats */}
            <div className="pd-side-card" style={{ display: "flex", gap: 0 }}>
              <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{place._count.reviews}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>💬 Reviews</div>
              </div>
              <div style={{ width: 1, background: "#f1f5f9" }} />
              <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{place._count.bookmarks}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>🔖 Saved</div>
              </div>
              {avgRating > 0 && (
                <>
                  <div style={{ width: 1, background: "#f1f5f9" }} />
                  <div style={{ flex: 1, textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#f59e0b" }}>{avgRating.toFixed(1)}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>⭐ Rating</div>
                  </div>
                </>
              )}
            </div>

            {/* Directions */}
            {place.googleMapsUrl && (
              <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-maps-btn">
                🗺️ เส้นทาง · Get Directions
              </a>
            )}

            {/* Key info */}
            <div className="pd-side-card pd-info-card">
              <div className="pd-side-title">📋 ข้อมูลสำคัญ <span style={{ fontSize: 11, color: "#94a3b8" }}>Key Info</span></div>
              <div className="pd-info-list">
                {place.openHours && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🕐</span>
                    <div><div className="pd-info-label">เวลาเปิด–ปิด · Hours</div><div className="pd-info-val">{place.openHours}</div></div>
                  </div>
                )}
                {place.closedDays && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">📅</span>
                    <div><div className="pd-info-label">วันหยุด · Closed</div><div className="pd-info-val">{place.closedDays}</div></div>
                  </div>
                )}
                {place.entryFee && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🎟️</span>
                    <div><div className="pd-info-label">ค่าเข้าชม · Entry fee</div><div className="pd-info-val">{place.entryFee}</div></div>
                  </div>
                )}
                {place.phone && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">📞</span>
                    <div><div className="pd-info-label">โทรศัพท์ · Phone</div><a href={`tel:${place.phone}`} className="pd-info-link">{place.phone}</a></div>
                  </div>
                )}
                {place.website && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">🌐</span>
                    <div>
                      <div className="pd-info-label">เว็บไซต์ · Website</div>
                      <a href={place.website} target="_blank" rel="noreferrer" className="pd-info-link">
                        {place.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
                {place.lineId && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">💬</span>
                    <div><div className="pd-info-label">Line ID</div><div className="pd-info-val">{place.lineId}</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="pd-side-card">
              <div className="pd-side-title">📍 ที่ตั้ง <span style={{ fontSize: 11, color: "#94a3b8" }}>Location</span></div>
              <div className="pd-loc-province">{place.province}</div>
              <div className="pd-loc-district">อ.{place.district}</div>
              {place.address && <div className="pd-loc-address">{place.address}</div>}
              {place.googleMapsUrl && (
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-maps-btn">
                  🗺️ เปิด Google Maps
                </a>
              )}
            </div>

            {/* Business */}
            {place.business && (
              <div className="pd-side-card">
                <div className="pd-side-title">🏢 ธุรกิจ · Business</div>
                {place.business.logoUrl && (
                  <img src={place.business.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", marginBottom: 10, border: "1px solid #f1f5f9" }} />
                )}
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>
                  {place.business.businessName}
                </div>
                {place.business.isVerified && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, marginBottom: 8 }}>
                    ✓ ธุรกิจที่ยืนยันแล้ว · Verified
                  </div>
                )}
                {place.business.phone && (
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>📞 {place.business.phone}</div>
                )}
                {place.business.website && (
                  <a href={place.business.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb", display: "block", marginTop: 4 }}>
                    🌐 {place.business.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            )}

            {/* Owner edit shortcut */}
            {isOwner && (
              <Link href={`/business/places/${slug}/edit`} className="pd-edit-btn">
                ✏️ แก้ไขสถานที่ · Edit Place
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
