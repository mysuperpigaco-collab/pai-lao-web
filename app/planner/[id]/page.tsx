import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import "./plan-view.css";

type Props = { params: Promise<{ id: string }> };

const STOP_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  ATTRACTION: { icon: "🏞️", label: "ที่เที่ยว",  color: "#3b82f6" },
  EAT:        { icon: "🍽️", label: "ร้านอาหาร", color: "#f59e0b" },
  SLEEP:      { icon: "🏨", label: "ที่พัก",     color: "#8b5cf6" },
  ACTIVITY:   { icon: "🎯", label: "กิจกรรม",   color: "#10b981" },
  TRANSPORT:  { icon: "🚌", label: "เดินทาง",   color: "#64748b" },
};

export default async function PlanViewPage({ params }: Props) {
  const { id } = await params;

  const plan = await (prisma as any).tripPlan.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true, firstName: true, username: true, avatarUrl: true } },
      stops: {
        orderBy: { order: "asc" },
        include: {
          place: { select: { id: true, slug: true, title: true, coverUrl: true } },
        },
      },
    },
  });

  if (!plan) return notFound();

  const session = await getCurrentUser();
  const isOwner = session?.userId === plan.userId;
  if (!plan.isPublic && !isOwner) return notFound();

  const authorName = plan.user?.displayName || plan.user?.firstName || plan.user?.username || "ผู้วางแผน";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pai-lao.vercel.app";
  const shareUrl = `${origin}/planner/${id}`;

  return (
    <div className="pv-root">
      {/* Controls (screen only) */}
      <div className="pv-controls no-print">
        <a href="/planner" className="pv-back">← กลับวางแผน</a>
        <button onClick={undefined} className="pv-print-btn" id="printBtn">🖨️ พิมพ์ / Save PDF</button>
        {plan.isPublic && (
          <span className="pv-share-url">🔗 {shareUrl}</span>
        )}
      </div>

      {/* Printable content */}
      <div className="pv-page">
        {/* Header */}
        <div className="pv-header">
          <div className="pv-badge">ไปเล่า · Trip Planner</div>
          <h1 className="pv-title">{plan.title}</h1>
          {plan.description && <p className="pv-desc">{plan.description}</p>}
          <div className="pv-meta">
            <span>✍️ {authorName}</span>
            {plan.startDate && (
              <span>📅 {plan.startDate}{plan.endDate ? ` – ${plan.endDate}` : ""}</span>
            )}
            {plan.province && <span>📍 {plan.province}</span>}
            <span>🚩 {plan.stops.length} จุดหมาย</span>
          </div>
        </div>

        {/* Stops */}
        <div className="pv-stops">
          <h2 className="pv-section-title">🗺️ แผนการเดินทาง · Itinerary</h2>
          {plan.stops.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>ยังไม่มีจุดหมาย</p>
          ) : plan.stops.map((stop: any, idx: number) => {
            const meta = STOP_LABELS[stop.stopType] ?? STOP_LABELS.ATTRACTION;
            return (
              <div key={stop.id} className="pv-stop">
                <div className="pv-stop-num" style={{ background: meta.color }}>{idx + 1}</div>
                <div className="pv-stop-body">
                  <div className="pv-stop-top">
                    <span className="pv-stop-name">{stop.name}</span>
                    <span className="pv-stop-type" style={{ background: meta.color + "18", color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  {(stop.province || stop.district) && (
                    <div className="pv-stop-loc">
                      📍 {[stop.province, stop.district].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {stop.notes && <p className="pv-stop-notes">{stop.notes}</p>}
                  {stop.googleMapsUrl && (
                    <div className="pv-maps-row">
                      🗺️ <span className="pv-maps-url">{stop.googleMapsUrl}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pv-footer">
          วางแผนด้วย ไปเล่า · {shareUrl}
        </div>
      </div>

      {/* Print button script */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('printBtn')?.addEventListener('click', () => window.print());
      ` }} />
    </div>
  );
}
