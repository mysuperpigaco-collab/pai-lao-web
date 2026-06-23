"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";

export interface PlaceCardData {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  coverUrl: string;
  province: string;
  district: string;
  category: string;
  isVerified?: boolean;
  avgRating?: number | null;
  communityCover?: string | null;
  business?: { businessName: string; isVerified?: boolean } | null;
  _count?: { reviews: number; bookmarks: number; likes?: number };
  descriptionShort?: string | null;
  shareCount?: number;
}

interface Props {
  place: PlaceCardData;
  distanceM?: number;
  newTab?: boolean;
}

const CAT_ICON: Record<string, string> = {
  NATURE:"🌿",CAFE:"☕",ACCOMMODATION:"🏨",CAMPING:"⛺",
  FOOD:"🍲",TEMPLE:"🛕",BEACH:"🏖️",MARKET:"🛍️",ADVENTURE:"🧗",MUSEUM:"🏛️",
};
const CAT_LABEL: Record<string, string> = {
  NATURE:"ธรรมชาติ",CAFE:"คาเฟ่",ACCOMMODATION:"ที่พัก",CAMPING:"แคมปิ้ง",
  FOOD:"อาหาร",TEMPLE:"วัด",BEACH:"ชายหาด",MARKET:"ตลาด",ADVENTURE:"ผจญภัย",MUSEUM:"พิพิธภัณฑ์",
};
const CAT_COLOR: Record<string, string> = {
  NATURE:"#16a34a",CAFE:"#92400e",ACCOMMODATION:"#1d4ed8",CAMPING:"#15803d",
  FOOD:"#b91c1c",TEMPLE:"#7c3aed",BEACH:"#0369a1",MARKET:"#b45309",ADVENTURE:"#c2410c",MUSEUM:"#6b21a8",
};

function fmtDist(m: number) {
  return m < 1000 ? `${m} ม.` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} กม.`;
}

export default function PlaceCard({ place, distanceM, newTab = false }: Props) {
  const [imgError,  setImgError ] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const icon  = CAT_ICON[place.category]  ?? "📍";
  const label = CAT_LABEL[place.category] ?? place.category;
  const color = CAT_COLOR[place.category] ?? "#0f172a";
  const avg   = place.avgRating;
  const revs  = place._count?.reviews  ?? 0;
  const bms   = place._count?.bookmarks ?? 0;
  const likes = place._count?.likes     ?? 0;
  const prov  = place.province?.split(" (")[0] ?? place.province ?? "";

  const displayImg = (!place.business && place.communityCover)
    ? place.communityCover
    : ((place.coverUrl && place.coverUrl !== "/images/default-place.svg") ? place.coverUrl : (place.communityCover || null));
  const showImg = !!displayImg && !imgError;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const x  = (e.clientX - r.left) / r.width;
    const y  = (e.clientY - r.top)  / r.height;
    const rx = (y - 0.5) * -16;
    const ry = (x - 0.5) *  16;
    el.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.02)`;
    el.style.boxShadow  = `0 22px 44px rgba(15,23,42,.18), 0 ${8 + ry}px ${16 - rx}px rgba(79,172,254,.12)`;
    el.style.transition = "transform .08s ease, box-shadow .08s ease";
    if (shineRef.current)
      shineRef.current.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.22) 0%, transparent 65%)`;
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform  = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
    el.style.boxShadow  = "0 2px 12px rgba(15,23,42,.06)";
    el.style.transition = "transform .5s cubic-bezier(0.22,1,0.36,1), box-shadow .5s ease";
    if (shineRef.current) shineRef.current.style.background = "none";
  };

  return (
    <Link
      href={`/place/${place.slug}`}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      style={{ textDecoration: "none", color: "inherit", display: "block", minWidth: 0, height: "100%" }}
    >
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          display: "flex", flexDirection: "column",
          borderRadius: 20, overflow: "hidden",
          background: "var(--pl-white)",
          boxShadow: "var(--pl-shadow-card)",
          border: "1px solid var(--pl-border)",
          willChange: "transform",
          position: "relative",
          height: "100%",
        }}
      >
        {/* Shine */}
        <div ref={shineRef} style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 20, pointerEvents: "none" }} />

        {/* Image */}
        <div style={{ position: "relative", height: 164, overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
          {showImg
            ? <img
                src={displayImg!}
                alt={place.title}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter:     imgLoaded ? "blur(0px)"  : "blur(10px)",
                  transform:  imgLoaded ? "scale(1)"   : "scale(1.06)",
                  opacity:    imgLoaded ? 1             : 0,
                  transition: "filter 0.5s ease, transform 0.5s ease, opacity 0.4s ease",
                }}
              />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${color}18, ${color}38)` }}>
                <span style={{ fontSize: 48 }}>{icon}</span>
              </div>
          }

          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,.65) 0%, transparent 55%)", pointerEvents: "none" }} />

          {/* Top row: province + rating */}
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
            {prov && (
              <span style={{ background: "rgba(255,255,255,.88)", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(6px)", boxShadow: "0 2px 6px rgba(0,0,0,.12)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {prov}
              </span>
            )}
            <div style={{ display: "flex", gap: 5, marginLeft: "auto", flexDirection: "column", alignItems: "flex-end" }}>
              {place.business?.isVerified && (
                <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999 }}>✓ Verified</span>
              )}
              {avg != null && avg > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(15,23,42,.75)", backdropFilter: "blur(8px)", color: "white", fontSize: 12, fontWeight: 800, padding: "4px 9px", borderRadius: 999, border: "1px solid rgba(255,255,255,.15)" }}>
                  <span style={{ color: "#fbbf24" }}>★</span>
                  {avg.toFixed(1)}
                  {revs > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{revs}</span>}
                </span>
              )}
            </div>
          </div>

          {/* Bottom row: category + distance or ownership */}
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
            <span style={{ background: color, color: "white", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}>
              {icon} {label}
            </span>
            {distanceM != null
              ? <span style={{ background: "rgba(16,185,129,.9)", color: "white", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
                  📍 {fmtDist(distanceM)}
                </span>
              : <div style={{ display: "flex", gap: 5 }}>
                  {place.business
                    ? <span style={{ background: "rgba(16,185,129,.85)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 999 }}>🏢 มีเจ้าของ</span>
                    : <span style={{ background: "rgba(100,116,139,.75)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>⭕ ยังไม่มี</span>
                  }
                </div>
            }
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "12px 14px 13px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--pl-text-primary)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.35, height: "2.7em" } as React.CSSProperties}>
            {place.title}
          </h3>
          <p style={{ fontSize: 11, color: "var(--pl-text-muted)", fontStyle: "italic", margin: 0, minHeight: "1.4em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {place.titleEn || ""}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--pl-border)" }}>
            <span style={{ fontSize: 11, color: "var(--pl-text-secondary)", fontWeight: 600 }}>
              📍 {[place.district, prov].filter(Boolean).join(", ")}
            </span>
            <div style={{ display: "flex", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--pl-text-muted)" }}>
              {likes > 0 && <span>❤️ {likes}</span>}
              {bms   > 0 && <span>🔖 {bms}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
