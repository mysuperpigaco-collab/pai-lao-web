import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PlaceReviews from "@/components/places/PlaceReviews";
import PlaceLikeButton from "@/components/places/PlaceLikeButton";
import PlaceBookmarkButton from "@/components/places/PlaceBookmarkButton";
import ShareButton from "@/components/common/ShareButton";
import ReportButton from "@/components/common/ReportButton";
import ClaimPlaceButton from "@/components/places/ClaimPlaceButton";
import PlaceHero from "@/components/places/PlaceHero";
import AdminPhotoUpload from "@/components/places/AdminPhotoUpload";
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

const AMENITY_META: Record<string, { icon: string; label: string; en: string }> = {
  PARKING:     { icon: "🅿️",  label: "ที่จอดรถ",       en: "Parking" },
  WIFI:        { icon: "📶",  label: "Wi-Fi ฟรี",      en: "Free Wi-Fi" },
  RESTROOM:    { icon: "🚻",  label: "ห้องน้ำ",         en: "Restroom" },
  AIRCON:      { icon: "❄️",  label: "แอร์",            en: "Air Con" },
  ACCESSIBLE:  { icon: "♿",  label: "เข้าถึงได้",      en: "Accessible" },
  CREDIT_CARD: { icon: "💳",  label: "รับบัตรเครดิต",   en: "Credit Card" },
  RESTAURANT:  { icon: "🍽️", label: "ร้านอาหาร",       en: "Restaurant" },
  CAFE:        { icon: "☕",  label: "เครื่องดื่ม",      en: "Café/Drinks" },
  CHARGING:    { icon: "🔌",  label: "ที่ชาร์จ",         en: "Charging" },
  ELEVATOR:    { icon: "🛗",  label: "ลิฟต์",           en: "Elevator" },
  POOL:        { icon: "🏊",  label: "สระว่ายน้ำ",      en: "Pool" },
  PHOTO_SPOT:  { icon: "📸",  label: "จุดถ่ายรูป",      en: "Photo Spot" },
};

export default async function PlaceDetailPage({ params }: Props) {
  const raw = await params;
  const slug = decodeURIComponent(raw.slug);

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
  const catLabel = CAT_LABEL[place.category] ?? place.category;
  const catIcon  = CAT_ICON[place.category]  ?? "📍";
  const isOwner    = session?.userId === place.business?.userId;
  const isBusiness = session?.role === "BUSINESS";

  let initialLiked = false;
  let initialSaved = false;
  const likeCount = await prisma.placeLike.count({ where: { placeId: place.id } });
  if (session) {
    const [pl, bm] = await Promise.all([
      prisma.placeLike.findUnique({ where: { userId_placeId: { userId: session.userId, placeId: place.id } } }),
      prisma.bookmark.findUnique({ where: { userId_placeId: { userId: session.userId, placeId: place.id } } }),
    ]);
    initialLiked = !!pl;
    initialSaved = !!bm;
  }

  const serializedReviews = place.reviews.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    replies: r.replies.map(rp => ({
      ...rp,
      createdAt: rp.createdAt.toISOString(),
    })),
  }));

  // Community photos from all trips that visited this place
  const communityStops = await prisma.timelineStop.findMany({
    where: { placeId: place.id },
    include: {
      trip: { select: { id: true, slug: true, title: true, _count: { select: { likes: true } } } },
    },
  });

  const communityStopsSorted = communityStops
    .filter(s => s.images.length > 0)
    .sort((a, b) => (b.trip?._count.likes ?? 0) - (a.trip?._count.likes ?? 0));

  const communityImages = communityStopsSorted.flatMap(s => s.images);
  const realCoverUrl = (place.coverUrl && place.coverUrl !== "/images/default-place.svg") ? place.coverUrl : null;
  const communityCover = !realCoverUrl && communityImages.length > 0 ? communityImages[0] : null;

  return (
    <div className="pd-page">
      <div className="pd-hero-wrap">
        <div className="pd-hero">
          <div className="pd-hero-actions">
            <Link href="/place" className="floating-back-btn">
              <span className="icon-circle">&#8592;</span>
              <span>สถานที่ทั้งหมด · All Places</span>
            </Link>
          </div>
          <PlaceHero
            placeId={place.id}
            realCoverUrl={realCoverUrl}
            communityImages={communityImages}
            isAdmin={session?.role === "ADMIN" || session?.role === "SUPERADMIN"}
          />
          <div className="pd-hero-overlay">
            <div className="pd-hero-content">
              <div className="pd-hero-badges">
                <span className="pd-badge">{catIcon} {catLabel}</span>
                {place.business?.isVerified && (
                  <span className="pd-badge pd-badge-green">&#10003; Verified Business</span>
                )}
                {place.business
                  ? <span className="pd-badge" style={{ background: "rgba(16,185,129,0.75)" }}>&#127970; มีเจ้าของ</span>
                  : <span className="pd-badge" style={{ background: "rgba(100,116,139,0.7)" }}>&#9711; ยังไม่มีเจ้าของ</span>
                }
                {isOwner && (
                  <span className="pd-badge" style={{ background: "rgba(245,158,11,0.7)" }}>
                    Your Place
                  </span>
                )}
                {place.petPolicy === "NOT_ALLOWED" && (
                  <span className="pd-badge" style={{ background: "rgba(185,28,28,0.75)", fontSize: 11 }}>
                    &#128683; ห้ามนำสัตว์เลี้ยง
                  </span>
                )}
                {place.petPolicy === "ALLOWED" && (
                  <span className="pd-badge" style={{ background: "rgba(21,128,61,0.75)", fontSize: 11 }}>
                    &#128062; สัตว์เลี้ยงเข้าได้
                  </span>
                )}
                {place.petPolicy === "CONDITIONS" && (
                  <span className="pd-badge" style={{ background: "rgba(146,64,14,0.75)", fontSize: 11 }}>
                    &#9888;&#65039; สัตว์เลี้ยงได้บางส่วน
                  </span>
                )}
              </div>
              <h1>{place.title}</h1>
              {place.titleEn && <p className="pd-title-en">{place.titleEn}</p>}
              <div className="pd-hero-meta">
                <span>{place.province} - {place.district}</span>
                {avgRating > 0 && (
                  <span className="pd-rating-pill">
                    {avgRating.toFixed(1)} ({place._count.reviews} reviews)
                  </span>
                )}
                {place._count.bookmarks > 0 && (
                  <span className="pd-bm-pill">{place._count.bookmarks} Saved</span>
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
                <h2>เกี่ยวกับสถานที่นี้ About</h2>
                <p className="pd-description">{place.description}</p>
              </div>
            )}
            {((place.amenities?.length > 0) || place.petPolicy) && (
              <div className="pd-card">
                <h2>สิ่งอำนวยความสะดวก <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Facilities</span></h2>
                {place.petPolicy && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 12, marginBottom: 16,
                    ...(place.petPolicy === "ALLOWED"
                      ? { background: "#dcfce7", border: "1.5px solid #bbf7d0", color: "#15803d" }
                      : place.petPolicy === "CONDITIONS"
                      ? { background: "#fef3c7", border: "1.5px solid #fde68a", color: "#92400e" }
                      : { background: "#fee2e2", border: "1.5px solid #fecaca", color: "#991b1b" })
                  }}>
                    <span style={{ fontSize: 20 }}>
                      {place.petPolicy === "ALLOWED" ? "🐾" : place.petPolicy === "CONDITIONS" ? "⚠️" : "🚫"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {place.petPolicy === "ALLOWED" ? "สัตว์เลี้ยงเข้าได้" : place.petPolicy === "CONDITIONS" ? "สัตว์เลี้ยงได้บางส่วน" : "ห้ามนำสัตว์เลี้ยง"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>
                        {place.petPolicy === "ALLOWED" ? "Pet Friendly ✓" : place.petPolicy === "CONDITIONS" ? "Pets allowed with conditions" : "No Pets Allowed"}
                      </div>
                    </div>
                  </div>
                )}
                {place.amenities?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {place.amenities.map((key: string) => {
                      const m = AMENITY_META[key];
                      if (!m) return null;
                      return (
                        <div key={key} style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                          borderRadius: 12, padding: "7px 14px",
                          color: "#065f46", fontWeight: 700,
                        }}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, lineHeight: 1.2 }}>{m.label}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1 }}>{m.en}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {place.gallery?.length > 0 && (
              <div className="pd-card">
                <h2>รูปภาพ Gallery</h2>
                <div className="pd-gallery">
                  {place.gallery.slice(0, 6).map((img, i) => (
                    <div key={i} className="pd-gal-item">
                      <img src={img} alt={place.title + " " + (i + 1)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(session?.role === "ADMIN" || session?.role === "SUPERADMIN") && (
              <div className="pd-card">
                <AdminPhotoUpload
                  placeId={place.id}
                  initialGallery={place.gallery ?? []}
                  initialCoverUrl={realCoverUrl}
                  onUpdate={() => {}}
                />
              </div>
            )}

            {communityImages.length > 0 && (
              <div className="pd-card">
                <h2>
                  📸 รูปจากนักเดินทาง
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}> Community Photos</span>
                </h2>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: -8, marginBottom: 12 }}>
                  รูปภาพที่นักเดินทางแชร์จากทริปของพวกเขา · Photos shared by travelers from their trips
                </p>
                <div className="pd-gallery">
                  {communityImages.slice(0, 9).map((img, i) => (
                    <div key={i} className="pd-gal-item">
                      <img src={img} alt={"Community photo " + (i + 1)} />
                    </div>
                  ))}
                </div>
                {communityImages.length > 9 && (
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    +{communityImages.length - 9} รูปเพิ่มเติม
                  </p>
                )}
              </div>
            )}

            {place.googleMapsUrl && (
              <div className="pd-card pd-map-card">
                <h2>แผนที่ Map</h2>
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-map-btn">
                  เปิดใน Google Maps
                </a>
              </div>
            )}
            <div className="pd-card">
              <h2>
                รีวิว
                {place._count.reviews > 0 && (
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}> ({place._count.reviews})</span>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}> Reviews</span>
              </h2>
              <PlaceReviews
                placeId={place.id}
                businessOwnerId={place.business?.userId ?? null}
                initialReviews={serializedReviews}
                avgRating={avgRating}
                currentUserId={session?.userId ?? null}
              />
            </div>
          </div>

          <aside className="pd-sidebar">
            <div className="pd-side-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ textAlign: "center", padding: "10px 0", borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{place._count.reviews}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2 }}>💬 รีวิว</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#e11d48" }}>{likeCount}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2 }}>❤️ ถูกใจ</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 0", borderRight: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{place._count.bookmarks}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2 }}>🔖 บันทึก</div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b" }}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginTop: 2 }}>⭐ คะแนน</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <PlaceLikeButton placeId={place.id} initialLiked={initialLiked} initialCount={likeCount} businessOwnerId={place.business?.userId ?? null} />
              <PlaceBookmarkButton placeId={place.id} initialSaved={initialSaved} />
            </div>

            <ShareButton
              title={place.title}
              placeId={place.id}
              initialShareCount={place.shareCount}
            />

            {session && !isOwner && (
              <div style={{ marginTop: 8 }}>
                <ReportButton
                  targetId={place.id}
                  targetType="PLACE"
                  currentUserId={session?.userId ?? null}
                  ownerId={place.business?.userId ?? null}
                />
              </div>
            )}

            {place.googleMapsUrl && (
              <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-maps-btn">
                &#x1F5FA; เส้นทาง · Get Directions
              </a>
            )}

            <div className="pd-side-card pd-info-card">
              <div className="pd-side-title">
                &#x1F4CB; ข้อมูลสำคัญ <span style={{ fontSize: 11, color: "#94a3b8" }}>Key Info</span>
              </div>
              <div className="pd-info-list">
                {place.openHours && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">&#x1F550;</span>
                    <div>
                      <div className="pd-info-label">เวลาเปิด-ปิด · Hours</div>
                      <div className="pd-info-val">{place.openHours}</div>
                    </div>
                  </div>
                )}
                {place.closedDays && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">&#x1F4C5;</span>
                    <div>
                      <div className="pd-info-label">วันหยุด · Closed</div>
                      <div className="pd-info-val">{place.closedDays}</div>
                    </div>
                  </div>
                )}
                {place.entryFee && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">&#x1F39F;</span>
                    <div>
                      <div className="pd-info-label">ค่าเข้าชม · Entry fee</div>
                      <div className="pd-info-val">{place.entryFee}</div>
                    </div>
                  </div>
                )}
                {place.phone && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">&#x1F4DE;</span>
                    <div>
                      <div className="pd-info-label">โทรศัพท์ · Phone</div>
                      <a href={"tel:" + place.phone} className="pd-info-link">{place.phone}</a>
                    </div>
                  </div>
                )}
                {place.website && (
                  <div className="pd-info-row">
                    <span className="pd-info-icon">&#x1F310;</span>
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
                    <span className="pd-info-icon">&#x1F4AC;</span>
                    <div>
                      <div className="pd-info-label">Line ID</div>
                      <div className="pd-info-val">{place.lineId}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pd-side-card">
              <div className="pd-side-title">
                &#x1F4CD; ที่ตั้ง <span style={{ fontSize: 11, color: "#94a3b8" }}>Location</span>
              </div>
              <div className="pd-loc-province">{place.province}</div>
              <div className="pd-loc-district">{place.district}</div>
              {place.address && <div className="pd-loc-address">{place.address}</div>}
              {place.googleMapsUrl && (
                <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="pd-maps-btn" style={{ marginTop: 12 }}>
                  Google Maps
                </a>
              )}
            </div>

            {place.business && (
              <div className="pd-side-card">
                <div className="pd-side-title">
                  &#x1F3E2; ธุรกิจ <span style={{ fontSize: 11, color: "#94a3b8" }}>Business</span>
                </div>
                {place.business.logoUrl && (
                  <img src={place.business.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", marginBottom: 10 }} />
                )}
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>
                  {place.business.businessName}
                </div>
                {place.business.isVerified && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, marginBottom: 8 }}>
                    Verified Business
                  </div>
                )}
                {place.business.phone && (
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{place.business.phone}</div>
                )}
                {place.business.website && (
                  <a href={place.business.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563eb", display: "block", marginTop: 4 }}>
                    {place.business.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            )}

            <ClaimPlaceButton
              placeSlug={slug}
              placeTitle={place.title}
              isBusiness={isBusiness}
              hasOwner={!!place.business}
            />

            {isOwner && (
              <Link href={"/business/places/" + slug + "/edit"} className="pd-edit-btn">
                &#x270F;&#xFE0F; แก้ไขสถานที่ · Edit Place
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
