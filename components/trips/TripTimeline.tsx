"use client";
import { useState } from "react";
import MapsButton from "@/components/common/MapsButton";
import ImageLightbox from "@/components/common/ImageLightbox";
import { useRouteHover } from "@/components/maps/RouteHoverContext";

interface TimelineStop {
  id: string;
  order: number;
  date: string;
  time?: string | null;
  placeName: string;
  province: string;
  district: string;
  description: string;
  transport?: string | null;
  duration?: string | null;
  cost?: string | null;
  images: string[];
  stopType?: string | null;
  googleMapsUrl?: string | null;
  tips?: string | null;
  placeId?: string | null;
}

type Props = { timeline: TimelineStop[] };

const STOP_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  ATTRACTION: { icon: "🏞️", label: "ที่เที่ยว",  color: "#3b82f6" },
  EAT:        { icon: "🍽️", label: "ร้านอาหาร", color: "#f59e0b" },
  SLEEP:      { icon: "🏨", label: "ที่พัก",     color: "#8b5cf6" },
  ACTIVITY:   { icon: "🎯", label: "กิจกรรม",   color: "#10b981" },
  TRANSPORT:  { icon: "🚌", label: "เดินทาง",   color: "#64748b" },
};

// สีหมุด/ลำดับ — ต้องตรงกับ ROUTE_COLORS ในหน้าทริป (app/trips/[slug]/page.tsx) เพื่อให้เลขในไทม์ไลน์สีตรงกับหมุดบนแผนที่
const ROUTE_COLORS = ["#ef4444","#f59e0b","#10b981","#0ea5e9","#6366f1","#7c3aed","#ec4899","#0f766e","#b45309","#15803d"];

const TRANSPORT_ICON: Record<string, string> = {
  "รถทัวร์": "🚌", "รถส่วนตัว": "🚗", "รถไฟ": "🚆",
  "เครื่องบิน": "✈️", "เรือ": "⛵", "มอเตอร์ไซค์": "🏍️", "เดินเท้า": "🚶",
};

function groupByDate(stops: TimelineStop[]) {
  const groups: { date: string; stops: TimelineStop[] }[] = [];
  stops.forEach(stop => {
    const last = groups[groups.length - 1];
    if (last && last.date === stop.date) last.stops.push(stop);
    else groups.push({ date: stop.date, stops: [stop] });
  });
  return groups;
}

export default function TripTimeline({ timeline }: Props) {
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ stopId: string; imgIdx: number } | null>(null);
  const { activeId, setActiveId } = useRouteHover();

  if (!timeline?.length) return (
    <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>ยังไม่มี timeline</div>
  );

  const sorted = [...timeline].sort((a, b) => a.order - b.order);
  // สีของแต่ละจุดตามลำดับ → ใช้ชุดเดียวกับหมุดบนแผนที่ (เลข i+1 ตรงกับเลขหมุด)
  const colorOf = new Map(sorted.map((s, i) => [s.id, ROUTE_COLORS[i % ROUTE_COLORS.length]]));
  const numOf = new Map(sorted.map((s, i) => [s.id, i + 1]));
  const groups = groupByDate(sorted);

  return (
    <div>
      <h2>🗺️ เส้นทางการเดินทาง · Itinerary</h2>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#64748b", marginBottom: 14,
            borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
            📅 {group.date}
          </div>
          {group.stops.map((stop) => {
            const meta = stop.stopType ? STOP_TYPE_META[stop.stopType] : null;
            const isExpanded = expandedStop === stop.id;
            const accent = colorOf.get(stop.id) ?? "#3b82f6";
            const isActive = activeId === stop.id;
            return (
              <div key={stop.id} style={{ display: "flex", gap: 14, marginBottom: 14 }}
                onMouseEnter={() => setActiveId(stop.id)}
                onMouseLeave={() => setActiveId(null)}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%",
                    background: accent,
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 4px ${accent}44, 0 2px 8px rgba(0,0,0,0.28)` : "0 2px 6px rgba(0,0,0,0.18)",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    transition: "transform .12s ease, box-shadow .12s ease" }}>
                    {numOf.get(stop.id) ?? stop.order + 1}
                  </div>
                  <div style={{ width: 2, background: "#e2e8f0", flex: 1, minHeight: 20, margin: "4px 0" }} />
                </div>
                <div style={{ flex: 1, background: "#f8fafc", borderRadius: 14, padding: "14px 16px",
                  cursor: "pointer", marginBottom: 4,
                  border: isActive ? `2px solid ${accent}` : "1px solid #e2e8f0",
                  boxShadow: isActive ? `0 6px 18px ${accent}33` : "none",
                  transform: isActive ? "translateX(3px)" : "translateX(0)",
                  transition: "border-color .12s ease, box-shadow .12s ease, transform .12s ease" }}
                  onClick={() => setExpandedStop(isExpanded ? null : stop.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 15, color: "#1e293b" }}>{stop.placeName}</span>
                        {meta && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                            background: meta.color + "18", color: meta.color }}>
                            {meta.icon} {meta.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        📍 {stop.province}{stop.district ? ` · ${stop.district}` : ""}
                        {stop.time && ` · 🕐 ${stop.time}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                      {stop.transport && <span title={stop.transport}>{TRANSPORT_ICON[stop.transport] ?? "🚗"}</span>}
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14 }}>
                      {stop.description && (
                        <p style={{ color: "#374151", lineHeight: 1.75, margin: "0 0 12px", whiteSpace: "pre-wrap" as const }}>
                          {stop.description}
                        </p>
                      )}

                      {/* Meta row: duration, cost */}
                      {(stop.duration || stop.cost) && (
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                          {stop.duration && <span>⏱️ {stop.duration}</span>}
                          {stop.cost && <span>💰 {stop.cost}</span>}
                        </div>
                      )}

                      {/* Tips */}
                      {stop.tips && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
                          padding: "8px 12px", marginBottom: 12, fontSize: 13, color: "#92400e" }}>
                          💡 <strong>เคล็ดลับ:</strong> {stop.tips}
                        </div>
                      )}

                      {/* Google Maps link */}
                      {stop.googleMapsUrl && (
                        <MapsButton
                          url={stop.googleMapsUrl}
                          placeName={stop.placeName}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
                            padding: "7px 14px", borderRadius: 10, border: "1.5px solid #3b82f6",
                            background: "#eff6ff", color: "#1d4ed8", fontSize: 13, fontWeight: 700,
                            cursor: "pointer" }}
                        />
                      )}

                      {/* Images */}
                      {stop.images?.filter(img => img && !img.includes("default-place.svg")).length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                          {stop.images.filter(img => img && !img.includes("default-place.svg")).map((img, ii) => (
                            <img key={ii} src={img} alt="" onClick={e => { e.stopPropagation(); setLightbox({ stopId: stop.id, imgIdx: ii }); }}
                              style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "2px solid #e2e8f0" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {lightbox && (() => {
        const stop = timeline.find(s => s.id === lightbox.stopId);
        if (!stop) return null;
        const filteredImgs = stop.images.filter(img => img && !img.includes("default-place.svg"));
        return (
          <ImageLightbox
            images={filteredImgs}
            startIndex={lightbox.imgIdx}
            captions={filteredImgs.map(() => stop.placeName)}
            onClose={() => setLightbox(null)}
          />
        );
      })()}
    </div>
  );
}
