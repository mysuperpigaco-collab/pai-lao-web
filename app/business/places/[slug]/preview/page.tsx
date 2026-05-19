import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import "@/app/place/[slug]/place-detail.css";

type Props = { params: Promise<{ slug: string }> };

export default async function PlacePreviewPage({ params }: Props) {
  const { slug } = await params;

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      business: {
        select: { id: true, businessName: true, logoUrl: true, isVerified: true, phone: true, website: true, userId: true },
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

  // Verify ownership
  const session = await getCurrentUser();
  const isOwner = session && (
    session.role === "ADMIN" ||
    place.business?.userId === session.userId
  );

  const avgRating = place.reviews.length
    ? place.reviews.reduce((s, r) => s + r.rating, 0) / place.reviews.length
    : 0;
  const ratingStars = Math.round(avgRating);

  return (
    <div>
      {/* ── Owner Preview Banner ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 999,
        background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: "999px", padding: "4px 12px", color: "#fff", fontSize: 12, fontWeight: 800, border: "1px solid rgba(255,255,255,0.3)" }}>
            👁️ โหมดดูตัวอย่าง · Preview Mode
          </span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
            นี่คือหน้าตาที่ผู้เยี่ยมชมจะเห็น · This is what visitors see
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/business/places/${slug}/edit`} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.4)", color: "#fff",
            padding: "8px 18px", borderRadius: "10px", textDecoration: "none",
            fontSize: 13, fontWeight: 700,
          }}>
            ✏️ แก้ไข · Edit
          </Link>
          <Link href="/business/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.95)",
            color: "#059669", padding: "8px 18px", borderRadius: "10px",
            textDecoration: "none", fontSize: 13, fontWeight: 800,
          }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ── Place Detail (same as public page) ── */}
      <div className="pd-page">
        <div className="pd-hero-wrap">
          <div className="pd-hero">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pd-container">
          <div className="pd-layout">
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
                    {place.gallery.map((img, i) => (
                      <div key={i} className="pd-gal-item">
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
                    เปิดใน Google Maps
                  </a>
                </div>
              )}

              {place.reviews.length > 0 && (
                <div className="pd-card">
                  <h2>💬 รีวิว ({place._count.reviews}) <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Reviews</span></h2>
                  {place.reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                          {(r.author.displayName || r.author.firstName).slice(0, 1)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.author.displayName || r.author.firstName}</div>
                          <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                          {r.text && <p style={{ margin: "6px 0 0", color: "#374151" }}>{r.text}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {place.reviews.length === 0 && (
                <div className="pd-card" style={{ textAlign: "center", color: "#94a3b8", padding: "32px" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <p style={{ margin: 0 }}>ยังไม่มีรีวิว · No reviews yet</p>
                </div>
              )}
            </div>

            <aside className="pd-sidebar">
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
                      <div><div className="pd-info-label">โทรศัพท์ · Phone</div><div className="pd-info-val">{place.phone}</div></div>
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
                      <div><div className="pd-info-label">Line</div><div className="pd-info-val">{place.lineId}</div></div>
                    </div>
                  )}
                </div>
              </div>

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

              {place.business && (
                <div className="pd-side-card">
                  <div className="pd-side-title">🏢 ธุรกิจ · Business</div>
                  <div style={{ fontWeight: 700 }}>{place.business.businessName}</div>
                  {place.business.isVerified && <div style={{ color: "#16a34a", fontSize: 13 }}>✓ ธุรกิจที่ยืนยันแล้ว · Verified</div>}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
