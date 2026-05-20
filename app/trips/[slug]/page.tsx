import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import BackButton from "@/components/common/BackButton";
import TripTimeline from "@/components/trips/TripTimeline";
import TripComments from "@/components/trips/TripComments";
import BookmarkButton from "@/components/trips/BookmarkButton";
import LikeButton from "@/components/trips/LikeButton";
import FollowButton from "@/components/trips/FollowButton";
import ShareButton from "@/components/common/ShareButton";
import Link from "next/link";
import "./trip-detail.css";

/** Extract YouTube video ID from various URL formats */
function getYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // /shorts/ID
      const m = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

type Props = { params: Promise<{ slug: string }> };

export default async function TripDetailPage({ params }: Props) {
  const raw = await params;
  const slug = decodeURIComponent(raw.slug);

  const trip = await prisma.trip.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true, username: true, firstName: true, lastName: true,
          displayName: true, avatarUrl: true, bio: true,
          _count: { select: { trips: true } },
        },
      },
      timeline: { orderBy: { order: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } },
          replies: {
            include: { author: { select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true } } },
          },
        },
      },
      _count: { select: { reviews: true, bookmarks: true } },
    },
  });

  if (!trip || !trip.isPublished) return notFound();

  // Check if logged-in user has bookmarked / liked this trip, and follow status
  const session = await getCurrentUser();
  let initialSaved = false;
  let initialLiked = false;
  let initialFollowing = false;
  let likeCount = 0;
  let followerCount = 0;

  if (session) {
    const [bm, lk, fl] = await Promise.all([
      prisma.bookmark.findUnique({
        where: { userId_tripId: { userId: session.userId, tripId: trip.id } },
      }),
      prisma.tripLike.findUnique({
        where: { userId_tripId: { userId: session.userId, tripId: trip.id } },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.userId, followingId: trip.author.id } },
      }),
    ]);
    initialSaved = !!bm;
    initialLiked = !!lk;
    initialFollowing = !!fl;
  }
  likeCount = await prisma.tripLike.count({ where: { tripId: trip.id } });
  followerCount = await prisma.follow.count({ where: { followingId: trip.author.id } });

  const avgRating = trip.reviews.length
    ? trip.reviews.reduce((s, r) => s + r.rating, 0) / trip.reviews.length
    : 0;

  const authorName = trip.author.displayName || trip.author.firstName;
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  const relatedTrips = await prisma.trip.findMany({
    where: { isPublished: true, NOT: { slug } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { slug: true, title: true, coverUrl: true, author: { select: { firstName: true, displayName: true } } },
  });

  return (
    <div className="place-page">

      {/* ─── HERO ─── */}
      <div className="hero-wrapper">
        <div className="hero-image">
          <div className="hero-actions">
            <BackButton fallback="/" />
          </div>
          {trip.coverUrl
            ? <img src={trip.coverUrl} alt={trip.title} />
            : <div style={{ width: "100%", height: 480, background: "#e2e8f0" }} />
          }
          <div className="hero-overlay">
            <div className="hero-content">
              <div className="hero-badges">
                {trip.mood && <span className="hero-badge">{trip.mood}</span>}
              </div>
              {trip.location && <p className="location">📍 {trip.location}</p>}
              <h1>{trip.title}</h1>
              <div className="hero-meta">
                <div className="hero-author">
                  {trip.author.avatarUrl
                    ? <img src={trip.author.avatarUrl} alt="" className="hero-avatar" style={{ borderRadius: "50%", objectFit: "cover" }} />
                    : <div className="hero-avatar">{authorInitial}</div>
                  }
                  <span>{authorName}</span>
                </div>
                {trip.budget && (
                  <>
                    <span className="hero-dot">·</span>
                    <span className="hero-budget">💰 งบ ~{Number(trip.budget).toLocaleString()} ฿</span>
                  </>
                )}
                {avgRating > 0 && (
                  <div className="hero-rating-pill">
                    {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
                    <span>{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN ─── */}
      <div className="place-container">
        <div className="trip-layout">

          <div className="trip-main">
            {trip.tags?.length > 0 && (
              <div className="tag-row">
                {trip.tags.map((tag, i) => <span className="trip-tag" key={i}>{tag}</span>)}
              </div>
            )}

            {trip.description && (
              <div className="content-card">
                <h2>🗒️ เรื่องเล่า</h2>
                <p className="description">{trip.description}</p>
              </div>
            )}

            {trip.gallery?.length > 0 && (
              <div className="content-card">
                <h2>📸 รูปจากทริป</h2>
                <div className="gallery-grid-new">
                  {trip.gallery.map((img, i) => (
                    <div className="gallery-item" key={i}>
                      <img src={img} alt={`${trip.title} ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Video Section ── */}
            {(trip.youtubeUrl || trip.tiktokUrl) && (
              <div className="content-card">
                <h2>🎬 วิดีโอ <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Video</span></h2>

                <div className="video-section">
                  {/* YouTube embed */}
                  {trip.youtubeUrl && (() => {
                    const ytId = getYoutubeId(trip.youtubeUrl!);
                    return ytId ? (
                      <div className="video-block">
                        <div className="video-label">
                          <span className="video-badge yt-badge">▶ YouTube</span>
                        </div>
                        <div className="yt-embed-wrap">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="video-block">
                        <div className="video-label">
                          <span className="video-badge yt-badge">▶ YouTube</span>
                        </div>
                        <a href={trip.youtubeUrl!} target="_blank" rel="noreferrer" className="video-link-btn yt-link">
                          🎬 ดูวิดีโอบน YouTube · Watch on YouTube
                        </a>
                      </div>
                    );
                  })()}

                  {/* TikTok */}
                  {trip.tiktokUrl && (
                    <div className="video-block">
                      <div className="video-label">
                        <span className="video-badge tt-badge">♪ TikTok</span>
                      </div>
                      <a href={trip.tiktokUrl} target="_blank" rel="noreferrer" className="video-link-btn">
                        <div className="tt-card">
                          <div className="tt-icon">♪</div>
                          <div className="tt-text">
                            <div className="tt-title">ดูวิดีโอบน TikTok</div>
                            <div className="tt-sub">Watch on TikTok · เปิดในแอป TikTok</div>
                            <div className="tt-url">{trip.tiktokUrl}</div>
                          </div>
                          <div className="tt-arrow">→</div>
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {trip.timeline.length > 0 && (
              <div className="content-card">
                <TripTimeline timeline={trip.timeline} />
              </div>
            )}

            <div className="content-card">
              <TripComments
                reviews={trip.reviews.map(r => ({
                  id: r.id,
                  rating: r.rating,
                  text: r.text,
                  createdAt: r.createdAt.toISOString(),
                  author: r.author,
                  replies: r.replies.map(rep => ({
                    id: rep.id,
                    text: rep.text,
                    createdAt: rep.createdAt.toISOString(),
                    author: rep.author,
                  })),
                }))}
                avgRating={avgRating}
                tripId={trip.id}
                currentUserId={session?.userId ?? null}
                tripAuthorId={trip.author.id}
              />
            </div>
          </div>

          <aside className="trip-sidebar">
            {/* Author card */}
            <div className="side-card author-card">
              {trip.author.avatarUrl
                ? <img src={trip.author.avatarUrl} alt="" className="author-avatar" style={{ borderRadius: "50%", objectFit: "cover" }} />
                : <div className="author-avatar">{authorInitial}</div>
              }
              <div className="author-name">{authorName}</div>
              <div className="author-sub">นักเล่าเรื่อง · {trip.author._count.trips} เรื่อง</div>
              {trip.author.bio && <p style={{ fontSize: 13, color: "#64748b", margin: "8px 0 0", textAlign: "center" }}>{trip.author.bio}</p>}
              <div style={{ marginTop: 12 }}>
                <FollowButton
                  targetUserId={trip.author.id}
                  initialFollowing={initialFollowing}
                  initialCount={followerCount}
                />
              </div>
            </div>

            {/* Like + Bookmark + Share */}
            <div className="side-card bm-card">
              <div className="bm-card-title">❤️ ถูกใจและบันทึก</div>
              <div className="bm-card-sub">กดถูกใจหรือบุ๊คมาร์คไว้อ่านทีหลัง</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <LikeButton tripId={trip.id} initialLiked={initialLiked} initialCount={likeCount} tripAuthorId={trip.author.id} />
                <BookmarkButton tripId={trip.id} initialSaved={initialSaved} />
              </div>
              <div style={{ marginTop: 8 }}>
                <ShareButton
                  title={trip.title}
                  tripId={trip.id}
                  initialShareCount={trip.shareCount}
                />
              </div>
            </div>

            {/* Info */}
            <div className="side-card">
              <div className="side-card-title">📋 ข้อมูลทริป</div>
              <div className="info-table">
                {trip.location && (
                  <div className="info-row">
                    <span className="info-icon">📍</span>
                    <div><div className="info-label">สถานที่</div><div className="info-val">{trip.location}</div></div>
                  </div>
                )}
                {trip.budget && (
                  <div className="info-row">
                    <span className="info-icon">💰</span>
                    <div><div className="info-label">งบประมาณ</div><div className="info-val">~{Number(trip.budget).toLocaleString()} ฿/คน</div></div>
                  </div>
                )}
                {trip.mood && (
                  <div className="info-row">
                    <span className="info-icon">🎯</span>
                    <div><div className="info-label">สไตล์ทริป</div><div className="info-val">{trip.mood}</div></div>
                  </div>
                )}
                {trip.timeline.length > 0 && (
                  <div className="info-row">
                    <span className="info-icon">🗺️</span>
                    <div><div className="info-label">จำนวนจุด</div><div className="info-val">{trip.timeline.length} จุดหมาย</div></div>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-icon">💬</span>
                  <div><div className="info-label">รีวิว</div><div className="info-val">{trip._count.reviews} รีวิว</div></div>
                </div>
                {trip.shareCount > 0 && (
                  <div className="info-row">
                    <span className="info-icon">↗</span>
                    <div><div className="info-label">แชร์</div><div className="info-val">{trip.shareCount.toLocaleString()} ครั้ง</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* Related */}
            {relatedTrips.length > 0 && (
              <div className="side-card">
                <div className="side-card-title">🔖 เรื่องที่เกี่ยวข้อง</div>
                <div className="related-list">
                  {relatedTrips.map(t => (
                    <Link href={`/trips/${t.slug}`} className="related-item" key={t.slug}>
                      <div className="related-thumb">
                        {t.coverUrl
                          ? <img src={t.coverUrl} alt={t.title} />
                          : <div style={{ width: "100%", height: "100%", background: "#e2e8f0" }} />
                        }
                      </div>
                      <div className="related-info">
                        <div className="related-title">{t.title}</div>
                        <div className="related-meta">{t.author.displayName || t.author.firstName}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
