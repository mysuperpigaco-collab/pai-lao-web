"use client";
import { useState } from "react";

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
}

type Props = { timeline: TimelineStop[] };

const TRANSPORT_ICON: Record<string, string> = {
  "รถทัวร์": "🚌", "รถส่วนตัว": "🚗", "เครื่องบิน": "✈️",
  "รถไฟ": "🚆", "เรือ": "⛵", "มอเตอร์ไซค์": "🏍️", "เดินเท้า": "🚶",
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

  if (!timeline?.length) return (
    <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>ยังไม่มี timeline</div>
  );

  const groups = groupByDate([...timeline].sort((a, b) => a.order - b.order));

  return (
    <div>
      <h2>🗺️ เส้นทางการเดินทาง</h2>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#64748b", marginBottom: 12,
            borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
            📅 {group.date}
          </div>
          {group.stops.map((stop) => (
            <div key={stop.id} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {stop.order + 1}
                </div>
                <div style={{ width: 2, background: "#e2e8f0", flex: 1, minHeight: 20, margin: "4px 0" }} />
              </div>
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 12, padding: "14px 16px",
                cursor: "pointer", border: "1px solid #e2e8f0" }}
                onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{stop.placeName}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>📍 {stop.province} · {stop.district}
                      {stop.time && ` · 🕐 ${stop.time}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {stop.transport && <span title={stop.transport}>{TRANSPORT_ICON[stop.transport] ?? "🚗"}</span>}
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{expandedStop === stop.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expandedStop === stop.id && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: "#374151", lineHeight: 1.7, margin: "0 0 12px" }}>{stop.description}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                      {stop.duration && <span>⏱️ {stop.duration}</span>}
                      {stop.cost && <span>💰 {stop.cost}</span>}
                    </div>
                    {stop.images?.length > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {stop.images.map((img, ii) => (
                          <img key={ii} src={img} alt="" onClick={(e) => { e.stopPropagation(); setLightbox({ stopId: stop.id, imgIdx: ii }); }}
                            style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {lightbox && (() => {
        const stop = timeline.find(s => s.id === lightbox.stopId);
        if (!stop) return null;
        return (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <img src={stop.images[lightbox.imgIdx]} alt="" style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12 }} />
          </div>
        );
      })()}
    </div>
  );
}
