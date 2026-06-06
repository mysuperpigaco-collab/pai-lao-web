import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import "./print.css";

type Props = { params: Promise<{ slug: string }> };

const STOP_TYPE_LABELS: Record<string, string> = {
  ATTRACTION: "🏞️ ที่เที่ยว",
  EAT:        "🍽️ ร้านอาหาร",
  SLEEP:      "🏨 ที่พัก",
  ACTIVITY:   "🎯 กิจกรรม",
  TRANSPORT:  "🚌 เดินทาง",
};

export default async function PrintTripPage({ params }: Props) {
  const raw  = await params;
  const slug = decodeURIComponent(raw.slug);

  const trip = await prisma.trip.findUnique({
    where: { slug },
    include: {
      author: { select: { displayName: true, firstName: true, username: true } },
      timeline: { orderBy: { order: "asc" } },
    },
  });

  if (!trip) return notFound();

  const session    = await getCurrentUser();
  const isOwner    = session?.userId === trip.authorId;
  const isAdmin    = session?.role === "ADMIN" || session?.role === "SUPERADMIN";
  const isApproved = (trip as any).approvalStatus === "APPROVED";

  if ((!trip.isPublished || !isApproved) && !isOwner && !isAdmin) return notFound();

  const authorName = (trip.author as any).displayName || (trip.author as any).firstName || (trip.author as any).username || "ผู้เขียน";
  const durationDays  = (trip as any).durationDays;
  const tripStyle     = (trip as any).tripStyle;
  const transportMode = (trip as any).transportMode;

  const STYLE_LABELS: Record<string,string> = {
    SOLO: "🧍 คนเดียว", COUPLE: "💑 คู่รัก",
    FAMILY: "👨‍👩‍👧 ครอบครัว", FRIENDS: "👫 กลุ่มเพื่อน",
  };

  // Group stops by date
  const byDate: { date: string; stops: typeof trip.timeline }[] = [];
  trip.timeline.forEach(stop => {
    const last = byDate[byDate.length - 1];
    if (last && last.date === stop.date) last.stops.push(stop);
    else byDate.push({ date: stop.date, stops: [stop] });
  });

  return (
    <div className="print-root">
      {/* Print controls — hidden in print mode */}
      <div className="no-print print-controls">
        <button onClick={() => typeof window !== "undefined" && window.print()} className="print-btn">
          🖨️ พิมพ์ / Print PDF
        </button>
        <a href={`/trips/${slug}`} className="back-link">← กลับหน้าทริป</a>
        <p className="print-hint">ใช้ Chrome → Print → Save as PDF เพื่อบันทึกเป็นไฟล์</p>
      </div>

      {/* ═══ Printable content ═══ */}
      <div className="print-page">
        {/* Header */}
        <div className="print-header">
          {trip.coverUrl && (
            <div className="print-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={trip.coverUrl} alt={trip.title} className="print-cover-img" />
            </div>
          )}
          <div className="print-title-block">
            <div className="print-site-badge">ไปเล่า · Pai-Lao</div>
            <h1 className="print-title">{trip.title}</h1>
            {(trip as any).subtitle && <p className="print-subtitle">{(trip as any).subtitle}</p>}
            <div className="print-meta">
              <span>✍️ {authorName}</span>
              {durationDays && <span>📅 {durationDays} วัน</span>}
              {trip.budget && <span>💰 ฿{Number(trip.budget).toLocaleString()}</span>}
              {tripStyle && <span>{STYLE_LABELS[tripStyle] ?? tripStyle}</span>}
              {transportMode && <span>🚗 {transportMode}</span>}
              {trip.mood && <span>🎯 {trip.mood}</span>}
            </div>
          </div>
        </div>

        {/* Story */}
        {trip.description && (
          <div className="print-section">
            <h2 className="print-section-title">📖 เรื่องราวทริป · Story</h2>
            <p className="print-story">{trip.description}</p>
          </div>
        )}

        {/* Timeline */}
        {byDate.length > 0 && (
          <div className="print-section">
            <h2 className="print-section-title">🗺️ เส้นทาง · Itinerary</h2>
            {byDate.map((group, gi) => (
              <div key={gi} className="print-day">
                <div className="print-day-header">📅 {group.date}</div>
                {group.stops.map((stop, si) => {
                  const stopTypeLabel = (stop as any).stopType ? STOP_TYPE_LABELS[(stop as any).stopType] : null;
                  return (
                    <div key={stop.id} className="print-stop">
                      <div className="print-stop-num">{stop.order + 1}</div>
                      <div className="print-stop-body">
                        <div className="print-stop-header">
                          <span className="print-stop-name">{stop.placeName}</span>
                          {stopTypeLabel && <span className="print-stop-type">{stopTypeLabel}</span>}
                          {stop.time && <span className="print-stop-time">🕐 {stop.time}</span>}
                        </div>
                        <div className="print-stop-location">
                          📍 {stop.province}{stop.district ? ` · ${stop.district}` : ""}
                          {stop.duration && <span> · ⏱️ {stop.duration}</span>}
                          {stop.cost && <span> · 💰 ฿{stop.cost}</span>}
                          {stop.transport && <span> · 🚌 {stop.transport}</span>}
                        </div>
                        {stop.description && <p className="print-stop-desc">{stop.description}</p>}
                        {(stop as any).tips && (
                          <div className="print-tips">💡 {(stop as any).tips}</div>
                        )}
                        {(stop as any).googleMapsUrl && (
                          <div className="print-maps">
                            🗺️ Google Maps: <span className="print-maps-url">{(stop as any).googleMapsUrl}</span>
                          </div>
                        )}
                        {stop.images?.length > 0 && (
                          <div className="print-stop-images">
                            {stop.images.slice(0, 3).map((img, ii) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={ii} src={img} alt="" className="print-stop-img" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {trip.tags?.length > 0 && (
          <div className="print-section print-tags-section">
            <span className="print-tags-label">แท็ก:</span>
            {trip.tags.map(t => <span key={t} className="print-tag">#{t}</span>)}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          ไปเล่า · {(process.env.NEXT_PUBLIC_SITE_URL || "pai-lao-web.vercel.app").replace("https://", "")}/trips/{slug}
        </div>
      </div>
    </div>
  );
}
