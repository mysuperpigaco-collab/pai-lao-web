import { notFound } from "next/navigation";
import { mockTrips } from "@/data/mockTrips";
import BackButton from "@/components/common/BackButton";
import TripTimeline from "@/components/trips/TripTimeline";
import TripComments from "@/components/trips/TripComments";
import BookmarkButton from "@/components/trips/BookmarkButton";
import "./trip-detail.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TripDetailPage({ params }: Props) {
  const { slug } = await params;
  const trip = mockTrips.find((t) => t.slug === slug);

  if (!trip) return notFound();

  const ratingStars = Math.round(trip.rating);

  return (
    <div className="place-page">

      {/* ─── HERO ─── */}
      <div className="hero-wrapper">
        <div className="hero-image">

          {/* Back */}
          <div className="hero-actions">
            <BackButton fallback="/" />
          </div>

          <img src={trip.image} alt={trip.title} />

          <div className="hero-overlay">
            <div className="hero-content">

              {/* Mood + category badges */}
              <div className="hero-badges">
                <span className="hero-badge">🌊 ธรรมชาติ</span>
                <span className="hero-badge">{trip.mood}</span>
              </div>

              <p className="location">📍 {trip.location}</p>
              <h1>{trip.title}</h1>

              {/* Meta row */}
              <div className="hero-meta">
                <div className="hero-author">
                  <div className="hero-avatar">{trip.author.initials}</div>
                  <span>{trip.author.name}</span>
                </div>
                <span className="hero-dot">·</span>
                <span className="hero-read">📖 อ่าน {trip.readTime} นาที</span>
                <span className="hero-dot">·</span>
                <span className="hero-budget">💰 งบ ~{trip.budget.toLocaleString()} ฿</span>
                <div className="hero-rating-pill">
                  {"★".repeat(ratingStars)}{"☆".repeat(5 - ratingStars)}
                  <span>{trip.rating}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="place-container">
        <div className="trip-layout">

          {/* ── LEFT / MAIN ── */}
          <div className="trip-main">

            {/* Tags */}
            <div className="tag-row">
              {trip.tags.map((tag, i) => (
                <span className="trip-tag" key={i}>{tag}</span>
              ))}
            </div>

            {/* Story body */}
            <div className="content-card">
              <h2>🗒️ เรื่องเล่า</h2>
              <p className="description">{trip.description}</p>
            </div>

            {/* Gallery */}
            {trip.gallery.length > 0 && (
              <div className="content-card">
                <h2>📸 รูปจากทริป</h2>
                <div className="gallery-grid-new">
                  {trip.gallery.map((img, i) => (
                    <div
                      className={`gallery-item ${i === 0 ? "gallery-main" : ""}`}
                      key={i}
                    >
                      <img src={img} alt={`${trip.title} ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="content-card">
              <TripTimeline timeline={trip.timeline} />
            </div>

            {/* Comments + Rating */}
            <div className="content-card">
              <TripComments
                comments={trip.comments}
                ratingCount={trip.ratingCount}
                ratingBreakdown={trip.ratingBreakdown}
                overallRating={trip.rating}
              />
            </div>

          </div>

          {/* ── RIGHT / SIDEBAR ── */}
          <aside className="trip-sidebar">

            {/* Author card */}
            <div className="side-card author-card">
              <div className="author-avatar">{trip.author.initials}</div>
              <div className="author-name">{trip.author.name}</div>
              <div className="author-sub">นักเล่าเรื่องตัวยง · {trip.author.stories} เรื่อง</div>
              <div className="author-stats">
                <div className="a-stat">
                  <strong>{trip.author.stories}</strong>เรื่องเล่า
                </div>
                <div className="a-stat">
                  <strong>{(trip.author.likes / 1000).toFixed(1)}k</strong>ถูกใจ
                </div>
                <div className="a-stat">
                  <strong>{trip.author.followers}</strong>ติดตาม
                </div>
              </div>
              <button className="follow-btn">+ ติดตาม</button>
            </div>

            {/* Bookmark */}
            <div className="side-card bm-card">
              <div className="bm-card-title">💾 บันทึกเรื่องนี้</div>
              <div className="bm-card-sub">บุ๊คมาร์คไว้อ่านทีหลัง หรือแชร์ให้เพื่อน</div>
              <BookmarkButton tripSlug={trip.slug} />
            </div>

            {/* Info */}
            <div className="side-card">
              <div className="side-card-title">📋 ข้อมูลทริป</div>
              <div className="info-table">
                <div className="info-row">
                  <span className="info-icon">📍</span>
                  <div>
                    <div className="info-label">สถานที่</div>
                    <div className="info-val">{trip.location}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">🗓️</span>
                  <div>
                    <div className="info-label">ระยะเวลา</div>
                    <div className="info-val">{trip.timeline[0]?.date} – {trip.timeline[trip.timeline.length - 1]?.date}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">💰</span>
                  <div>
                    <div className="info-label">งบประมาณ</div>
                    <div className="info-val">~{trip.budget.toLocaleString()} ฿/คน</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">🎯</span>
                  <div>
                    <div className="info-label">สไตล์ทริป</div>
                    <div className="info-val">{trip.mood}</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-icon">🗺️</span>
                  <div>
                    <div className="info-label">จำนวนจุด</div>
                    <div className="info-val">{trip.timeline.length} จุดหมาย</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related */}
            <div className="side-card">
              <div className="side-card-title">🔖 เรื่องที่เกี่ยวข้อง</div>
              <div className="related-list">
                {mockTrips
                  .filter((t) => t.slug !== trip.slug)
                  .slice(0, 3)
                  .map((t) => (
                    <a href={`/trips/${t.slug}`} className="related-item" key={t.slug}>
                      <div className="related-thumb">
                        <img src={t.image} alt={t.title} />
                      </div>
                      <div className="related-info">
                        <div className="related-title">{t.title}</div>
                        <div className="related-meta">{t.author.name} · {t.readTime} นาที</div>
                      </div>
                    </a>
                  ))}
              </div>
            </div>

          </aside>
        </div>
      </div>

    </div>
  );
}
