"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface PlaceNode {
  id: string; slug: string; title: string; titleEn: string | null;
  coverUrl: string | null; province: string; district: string; category: string;
  lat: number | null; lng: number | null; googleMapsUrl: string | null;
  createdAt: string;
  _count: { reviews: number; bookmarks: number };
  distanceM: number;
  similarity: number;
}
interface DupPair {
  a: PlaceNode;
  b: PlaceNode;
  distanceM: number;
  similarity: number;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

function PlaceCard({ p, label }: { p: PlaceNode; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: "#0f172a", borderRadius: 10, overflow: "hidden",
      border: "1px solid #1e293b" }}>
      <div style={{ position: "relative" }}>
        {p.coverUrl
          ? <img src={p.coverUrl} alt={p.title} style={{ width: "100%", height: 110, objectFit: "cover" }} />
          : <div style={{ width: "100%", height: 110, background: "#1e293b", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 32 }}>📍</div>}
        <div style={{ position: "absolute", top: 8, left: 8, background: "#0f172a88",
          borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#94a3b8" }}>
          {label}
        </div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#f1f5f9", marginBottom: 2 }}>{p.title}</div>
        {p.titleEn && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{p.titleEn}</div>}
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>
          📍 {p.province} · {p.district} · {p.category}
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
          ⭐ {p._count.reviews} รีวิว · 🔖 {p._count.bookmarks} · {fmt(p.createdAt)}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href={`/place/${p.slug}`} target="_blank"
            style={{ fontSize: 11, color: "#4facfe", textDecoration: "none",
              background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "3px 10px" }}>
            🔗 ดูสถานที่
          </Link>
          {p.googleMapsUrl && (
            <a href={p.googleMapsUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: "#4facfe", textDecoration: "none",
                background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "3px 10px" }}>
              Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDuplicatesPage() {
  const [pairs, setPairs] = useState<DupPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "exact" | "near">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/duplicate-places").then(r => r.json());
      setPairs(d.pairs || []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = pairs.filter(p => {
    if (filter === "exact") return p.similarity >= 90;
    if (filter === "near") return p.distanceM <= 10;
    return true;
  });

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">
          🔍 ตรวจสอบสถานที่ซ้ำ
          {loaded && pairs.length > 0 && (
            <span style={{ marginLeft: 10, background: "#f59e0b", color: "#000",
              fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 8px" }}>
              {pairs.length} คู่
            </span>
          )}
        </div>
        <div className="adm-topbar-right">
          {!loaded && !loading && (
            <button className="adm-btn primary" onClick={load}>
              🔍 เริ่มตรวจสอบ
            </button>
          )}
          {loaded && (
            <button className="adm-btn ghost" onClick={load} disabled={loading}>
              🔄 รีเฟรช
            </button>
          )}
        </div>
      </div>

      <div className="adm-content">
        {!loaded && !loading && (
          <div className="adm-card" style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              ตรวจสอบสถานที่ที่อาจซ้ำ
            </div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              ระบบจะเช็คสถานที่ที่ APPROVED ทั้งหมด
              หาคู่ที่อยู่ใกล้กัน ≤50ม. และชื่อคล้ายกัน ≥60%
            </div>
            <button className="adm-btn primary" onClick={load} style={{ fontSize: 14, padding: "10px 24px" }}>
              🔍 เริ่มตรวจสอบ
            </button>
          </div>
        )}

        {loading && (
          <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            ⏳ กำลังตรวจสอบ...
          </div>
        )}

        {loaded && !loading && (
          <>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ color: "#64748b", fontSize: 12, marginRight: 4 }}>กรอง:</div>
              {([["all", "ทั้งหมด"], ["exact", "ชื่อเหมือนมาก ≥90%"], ["near", "ระยะ ≤10ม."]] as [string, string][]).map(([v, l]) => (
                <button key={v} className={`adm-btn ${filter === v ? "primary" : "ghost"} sm`}
                  onClick={() => setFilter(v as any)}>
                  {l}
                </button>
              ))}
              <span style={{ color: "#475569", fontSize: 12, marginLeft: 4 }}>
                แสดง {filtered.length} / {pairs.length} คู่
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="adm-card" style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
                🎉 {pairs.length === 0 ? "ไม่พบสถานที่ซ้ำ" : "ไม่มีคู่ตรงเงื่อนไขที่เลือก"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtered.map((pair, i) => (
                  <div key={`${pair.a.id}:${pair.b.id}`} className="adm-card" style={{ padding: 16 }}>
                    {/* Header */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14,
                      flexWrap: "wrap" }}>
                      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{
                        background: pair.distanceM <= 10 ? "#450a0a" : "#1c1003",
                        color: pair.distanceM <= 10 ? "#fca5a5" : "#fbbf24",
                        fontSize: 12, fontWeight: 800, borderRadius: 8, padding: "3px 10px",
                      }}>
                        📍 {pair.distanceM}ม.
                      </span>
                      <span style={{
                        background: pair.similarity >= 90 ? "#052e16" : "#1e293b",
                        color: pair.similarity >= 90 ? "#86efac" : "#94a3b8",
                        fontSize: 12, fontWeight: 800, borderRadius: 8, padding: "3px 10px",
                      }}>
                        🔤 คล้าย {pair.similarity}%
                      </span>
                      {pair.similarity >= 90 && (
                        <span style={{ background: "#dc2626", color: "#fff",
                          fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "2px 8px" }}>
                          ⚠️ ซ้ำมาก
                        </span>
                      )}
                    </div>

                    {/* Two place cards side by side */}
                    <div style={{ display: "flex", gap: 12 }}>
                      <PlaceCard p={pair.a} label="สถานที่ A" />
                      <PlaceCard p={pair.b} label="สถานที่ B" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
