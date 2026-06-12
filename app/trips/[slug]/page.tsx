import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import TripRichContent from "@/components/trips/TripRichContent";
import BackButton from "@/components/common/BackButton";
import TripTimeline from "@/components/trips/TripTimeline";
import TripComments from "@/components/trips/TripComments";
import ViewTracker from "@/components/common/ViewTracker";
import BookmarkButton from "@/components/trips/BookmarkButton";
import LikeButton from "@/components/trips/LikeButton";
import FollowButton from "@/components/trips/FollowButton";
import ShareButton from "@/components/common/ShareButton";
import ReportButton from "@/components/common/ReportButton";
import { TripGallery } from "@/components/places/PlaceGallery";
import Link from "next/link";
import ReadingProgress from "@/components/common/ReadingProgress";
import BackToTop from "@/components/common/BackToTop";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pai-lao-web.vercel.app";

export async function generateMetadata({ params }: Props) {
  const raw = await params;
  const slug = decodeURIComponent(raw.slug);

  const trip = await prisma.trip.findUnique({
    where: { slug },
    select: {
      title: true, subtitle: true, description: true,
      coverUrl: true, mood: true, tags: true,
      author: { select: { displayName: true, firstName: true } },
      timeline: { select: { province: true }, take: 1, orderBy: { order: "asc" } },
    },
  }).catch(() => null);

  if (!trip) return { title: "ไม่พบทริป | ไปเล่า" };

  const authorName = trip.author?.displayName || trip.author?.firstName || "ไปเล่า";
  const province   = trip.timeline?.[0]?.province;
  const desc       = trip.subtitle
    || trip.description?.replace(/<[^>]+>/g, "").slice(0, 160)
    || `เรื่องเล่าการเดินทางโดย ${authorName}`;
  const image      = trip.coverUrl || `${SITE_URL}/opengraph-image`;

  return {
    title:       `${trip.title} | ไปเล่า`,
    description: desc,
    keywords:    [trip.mood, province, ...(trip.tags ?? [])].filter(Boolean).join(", "),
    openGraph: {
      title:       trip.title,
      description: desc,
      url:         `${SITE_URL}/trips/${slug}`,
      siteName:    "ไปเล่า",
      images:      [{ url: image, width: 1200, height: 630, alt: trip.title }],
      type:        "article",
      locale:      "th_TH",
    },
    twitter: {
      card:        "summary_large_image",
      title:       trip.title,
      description: desc,
      images:      [image],
    },
  };
}

export default async function TripDetailPage({ params }: Props) {
  const raw = await params;
  const slug = decodeURIComponent(raw.slug);

  let trip: any = null;
  try {
    trip = await prisma.trip.findUnique({
      where: { slug },
      include: {
      author: {
        select: {
          id: true, username: true, firstName: true, lastName: true,
          displayName: true, avatarUrl: true, bio: true, role: true,
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

  } catch (e) {
    console.error("Trip page error:", e);
    return notFound();
  }
  if (!trip) return notFound();

  // ── อนุญาตให้เจ้าของและแอดมินดูทริปที่ยังไม่ได้รับการอนุมัติ ──
  const session = await getCurrentUser();
  const approvalStatus: string = (trip as any).approvalStatus ?? "APPROVED";

  if (!trip.isPublished || approvalStatus !== "APPROVED") {
    const isOwner = session?.userId === trip.author.id;
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";
    if (!isOwner && !isAdmin) return notFound();
  }

  // Check if logged-in user has bookmarked / liked this trip, and follow status
  let initialSaved = false;
  let initialLiked = false;
  let initialFollowing = false;
  let likeCount = 0;
  let followerCount = 0;

  if (session) {
    const [bm, lk, fl] = await Promise.all([
      prisma.bookmark.findUnique({
        where: { userId_tripId: { userId: session.userId, tripId: trip.id } },
      }).catch(() => null),
      prisma.tripLike.findUnique({
        where: { userId_tripId: { userId: session.userId, tripId: trip.id } },
      }).catch(() => null),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.userId, followingId: trip.author.id } },
      }).catch(() => null),
    ]);
    initialSaved = !!bm;
    initialLiked = !!lk;
    initialFollowing = !!fl;
  }
  likeCount = await prisma.tripLike.count({ where: { tripId: trip.id } }).catch(() => 0);
  followerCount = await prisma.follow.count({ where: { followingId: trip.author.id } }).catch(() => 0);

  const avgRating = trip.reviews.length
    ? trip.reviews.reduce((s: number, r: any) => s + r.rating, 0) / trip.reviews.length
    : 0;

  const authorName = trip.author.displayName || trip.author.firstName || "?";
  const authorInitial = authorName.slice(0, 1).toUpperCase();

  const relatedTrips = await prisma.trip.findMany({
    where: { isPublished: true, NOT: { slug } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { slug: true, title: true, coverUrl: true, author: { select: { firstName: true, displayName: true } } },
  });

  const isOwner = session?.userId === trip.author.id;
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "Article",
    headline:   trip.title,
    description: trip.subtitle || trip.description?.replace(/<[^>]+>/g, "").slice(0, 160) || "",
    image:      trip.coverUrl ? [trip.coverUrl] : [],
    author: {
      "@type": "Person",
      name:    authorName,
      url:     `${SITE_URL}/user/${trip.author?.username}`,
    },
    publisher: { "@type": "Organization", name: "ไปเล่า", url: SITE_URL },
    datePublished: trip.createdAt,
    dateModified:  trip.updatedAt,
    url:           `${SITE_URL}/trips/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/trips/${slug}` },
  };

  return (
    <>
    <ReadingProgress />
    <BackToTop />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <ViewTracker type="trips" slug={slug} />
    <div className="place-page">

      {/* ─── Approval Status Banner ─── */}
      {approvalStatus !== "APPROVED" && (isOwner || isAdmin) && (
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: approvalStatus === "REJECTED" ? "#7f1d1d" : "#78350f",
          borderBottom: `2px solid ${approvalStatus === "REJECTED" ? "#ef4444" : "#f59e0b"}`,
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2rem" }}>
              {approvalStatus === "REJECTED" ? "❌" : "⏳"}
            </span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                {approvalStatus === "REJECTED"
                  ? "ทริปนี้ถูกปฏิเสธ — ไม่แสดงต่อสาธารณะ"
                  : "ทริปนี้กำลังรอการตรวจสอบจากแอดมิน — ยังไม่แสดงต่อสาธารณะ"}
              </div>
              {approvalStatus === "REJECTED" && (trip as any).rejectionReason && (
                <div style={{ color: "#fca5a5", fontSize: "0.8rem", marginTop: 2 }}>
                  เหตุผล: {(trip as any).rejectionReason}
                </div>
              )}
            </div>
          </div>
          {isAdmin && (
            <a href="/admin/approvals"
              style={{
                background: "rgba(255,255,255,0.15)", color: "#fff",
                borderRadius: 8, padding: "6px 14px", fontSize: "0.8rem",
                fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
                border: "1px solid rgba(255,255,255,0.3)",
              }}>
              🛡️ ไปหน้าอนุมัติ
            </a>
          )}
        </div>
      )}

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
                  {(trip.author.role === "ADMIN" || trip.author.role === "SUPERADMIN")
                    ? <span>{authorName}</span>
                    : <Link href={`/user/${trip.author.username}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>{authorName}</Link>}
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
                {trip.tags.map((tag: string, i: number) => <span className="trip-tag" key={i}>{tag}</span>)}
              </div>
            )}

            {trip.description && trip.description !== "<p></p>" && trip.description !== "<p><br></p>" && (
              <div className="content-card">
                <h2>🗒️ เรื่องเล่า</h2>
                {trip.description?.startsWith("<") ? (
                  <TripRichContent
                    html={trip.description ?? ""}
                  />
                ) : (
                  <p className="description">{trip.description ?? ""}</p>
                )}
              </div>
            )}

            {trip.gallery?.length > 0 && (
              <div className="content-card">
                <h2>📸 รูปจากทริป</h2>
                <TripGallery images={trip.gallery} />
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
                reviews={trip.reviews.map((r: any) => ({
                  id: r.id,
                  rating: r.rating,
                  text: r.text,
                  createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ""),
                  author: r.author,
                  likes: r.likes ?? 0,
                  replies: r.replies.map((rep: any) => ({
                    id: rep.id,
                    text: rep.text,
                    createdAt: rep.createdAt instanceof Date ? rep.createdAt.toISOString() : String(rep.createdAt ?? ""),
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
              {(trip.author.role === "ADMIN" || trip.author.role === "SUPERADMIN")
                ? <div className="author-name">{authorName}</div>
                : <Link href={`/user/${trip.author.username}`} className="author-name" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>{authorName}</Link>}
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
              {session && !isOwner && (
                <div style={{ marginTop: 8 }}>
                  <ReportButton
                    targetId={trip.id}
                    targetType="TRIP"
                    currentUserId={session?.userId ?? null}
                    ownerId={trip.author.id}
                  />
                </div>
              )}
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
                {(trip as any).durationDays && (
                  <div className="info-row">
                    <span className="info-icon">📅</span>
                    <div><div className="info-label">ระยะเวลา · Duration</div><div className="info-val">{(trip as any).durationDays} วัน</div></div>
                  </div>
                )}
                {(trip as any).tripStyle && (
                  <div className="info-row">
                    <span className="info-icon">👥</span>
                    <div><div className="info-label">รูปแบบ · Type</div><div className="info-val">
                      {({"SOLO":"🧍 คนเดียว","COUPLE":"💑 คู่รัก","FAMILY":"👨‍👩‍👧 ครอบครัว","FRIENDS":"👫 กลุ่มเพื่อน"} as Record<string,string>)[(trip as any).tripStyle as string] ?? (trip as any).tripStyle}
                    </div></div>
                  </div>
                )}
                {(trip as any).transportMode && (
                  <div className="info-row">
                    <span className="info-icon">🚗</span>
                    <div><div className="info-label">ยานพาหนะ · Transport</div><div className="info-val">{(trip as any).transportMode}</div></div>
                  </div>
                )}
                {trip.mood && (
                  <div className="info-row">
                    <span className="info-icon">🎯</span>
                    <div><div className="info-label">สไตล์ทริป · Mood</div><div className="info-val">{trip.mood}</div></div>
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
    </>
  );
}
