"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDistricts } from "@/data/thailand";

type Promotion = {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  discount?: string;
  condition?: string;
  startDate: string;
  endDate: string;
  place?: { id: string; title: string; slug: string; province?: string; district?: string };
  business: { id: string; businessName: string; logoUrl?: string };
};

const PROVINCES = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น",
  "จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย",
  "เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา",
  "นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์",
  "ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา",
  "พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต",
  "มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง",
  "ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา",
  "สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี",
  "สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง",
  "อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี",
];

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "หมดอายุ";
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "วันสุดท้าย!";
  if (days <= 3) return `เหลือ ${days} วัน`;
  return `เหลือ ${days} วัน`;
}

function isUrgent(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 3 * 86400000;
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }}>
      <div style={{ height: 140, background: "#e5e7eb" }} />
      <div style={{ padding: "14px 16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb" }} />
          <div style={{ height: 12, background: "#e5e7eb", borderRadius: 4, width: "50%" }} />
        </div>
        <div style={{ height: 18, background: "#e5e7eb", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 13, background: "#e5e7eb", borderRadius: 4, width: "70%" }} />
      </div>
    </div>
  );
}

function PromoCard({ promo }: { promo: Promotion }) {
  const urgent = isUrgent(promo.endDate);
  const dl = daysLeft(promo.endDate);

  return (
    <div style={{
      background: "#fff", borderRadius: 20, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      transition: "transform 0.2s, box-shadow 0.2s",
      display: "flex", flexDirection: "column",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      {/* Cover */}
      <div style={{ height: 140, position: "relative", flexShrink: 0, background: promo.coverUrl ? "none" : "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
        {promo.coverUrl && <img src={promo.coverUrl} alt={promo.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.45))" }} />
        {promo.discount && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", fontWeight: 800, fontSize: 13, padding: "4px 12px", borderRadius: 20 }}>
            {promo.discount}
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 10, left: 12,
          background: urgent ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.5)",
          color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
        }}>
          {dl}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Business */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {promo.business.logoUrl
              ? <img src={promo.business.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "🏪"}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{promo.business.businessName}</span>
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 6, lineHeight: 1.4 }}>{promo.title}</div>

        {promo.description && (
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, lineHeight: 1.6, flex: 1,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {promo.description}
          </div>
        )}

        {promo.condition && (
          <div style={{ fontSize: 12, color: "#b45309", fontWeight: 600, marginBottom: 10, background: "#fef3c7", borderRadius: 8, padding: "5px 10px" }}>
            📌 {promo.condition}
          </div>
        )}

        {promo.place && (
          <Link href={`/place/${promo.place.slug}`} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none",
            marginBottom: 8,
          }}>
            📍 {promo.place.title}
            {promo.place.province && <span style={{ color: "#9ca3af", fontWeight: 400 }}>· {promo.place.province}</span>}
          </Link>
        )}

        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: "auto" }}>
          {new Date(promo.startDate).toLocaleDateString("th-TH")} – {new Date(promo.endDate).toLocaleDateString("th-TH")}
        </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [search, setSearch] = useState("");

  const [enabled, setEnabled] = useState<boolean | null>(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (district) params.set("district", district);
    const res = await fetch(`/api/promotions?${params.toString()}`);
    const data = await res.json();
    setPromotions(data.promotions || []);
    setLoading(false);
  }, [province, district]);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const on = d.settings?.promotionsEnabled === "true";
        setEnabled(on);
        if (on) fetchPromotions();
        else setLoading(false);
      })
      .catch(() => { setEnabled(true); fetchPromotions(); });
  }, []);

  useEffect(() => {
    if (enabled) fetchPromotions();
  }, [province, district]);

  const filtered = search
    ? promotions.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.business.businessName.toLowerCase().includes(search.toLowerCase()) ||
        p.place?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : promotions;

  return (
    <div className="promo-page">

      {/* Hero */}
      <div style={{overflowX:"hidden"}}>
      <div className="promo-hero">
        <div className="promo-hero-deco1" />
        <div className="promo-hero-deco2" />
        <div className="promo-hero-inner">
          <p className="promo-hero-tag">SPECIAL DEALS</p>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <h1 className="promo-hero-title">โปรโมชั่นวันนี้ <span>Today&apos;s Promotions</span></h1>
          <p className="promo-hero-sub">
            ดีลพิเศษจากร้านค้าและสถานที่ท่องเที่ยวทั่วไทย<br />
            <span>Exclusive deals from businesses across Thailand</span>
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{promotions.length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>โปรโมชั่นตอนนี้</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Active Deals</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.25)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {new Set(promotions.map(p => p.place?.province).filter(Boolean)).size}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>จังหวัด</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Provinces</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.25)", alignSelf: "stretch" }} />
            <div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {new Set(promotions.map(p => p.business.id)).size}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>ร้านค้าที่ร่วม</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Partners</div>
            </div>
          </div>

          {/* Search/Filter bar */}
          <div className="promo-search-wrap">
            <input
              type="text"
              placeholder="ค้นหาชื่อโปรโมชั่น, ร้าน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="promo-search-input"
            />
            <select
              value={province}
              onChange={e => { setProvince(e.target.value); setDistrict(""); }}
              className="promo-search-select"
            >
              <option value="">ทุกจังหวัด</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              disabled={!province}
              className="promo-search-select"
            >
              <option value="">{province ? "ทุกอำเภอ" : "เลือกจังหวัดก่อน"}</option>
              {province && getDistricts(province).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(province || district || search) && (
              <button onClick={() => { setProvince(""); setDistrict(""); setSearch(""); }} className="promo-clear-btn">
                ล้างตัวกรอง ✕
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Cards */}
      <div style={{ minHeight: "60vh", background: "#f8fafb", padding: "32px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {!loading && promotions.length > 0 && (
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 4, height: 24, background: "#f59e0b", borderRadius: 2 }} />
              <span style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>
                {province || district ? `โปรโมชั่นใน${province || ""}${district ? ` · ${district}` : ""}` : "โปรโมชั่นทั้งหมด"}
              </span>
              <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>
                {filtered.length} รายการ
              </span>
            </div>
          )}

          {enabled === false ? (
            <div style={{ textAlign:"center", padding:"80px 24px", background:"#fff", borderRadius:20 }}>
              <div style={{ fontSize:56, marginBottom:14 }}>🔒</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#374151", marginBottom:8 }}>ระบบโปรโมชั่นยังไม่เปิดให้บริการ</div>
              <div style={{ fontSize:14, color:"#9ca3af" }}>กลับมาใหม่เร็วๆ นี้ครับ</div>
            </div>
          ) : loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "#fff", borderRadius: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🎁</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                {province || district ? `ไม่พบโปรโมชั่นใน${province}${district ? ` · ${district}` : ""}` : "ยังไม่มีโปรโมชั่นในขณะนี้"}
              </div>
              <div style={{ fontSize: 14, color: "#9ca3af" }}>
                {province || district ? "ลองเปลี่ยนจังหวัดหรืออำเภอดูครับ" : "กลับมาใหม่เร็วๆ นี้นะครับ"}
              </div>
              {(province || district) && (
                <button onClick={() => { setProvince(""); setDistrict(""); }} style={{
                  marginTop: 16, padding: "10px 24px", borderRadius: 10,
                  background: "#f59e0b", color: "#fff", border: "none",
                  fontWeight: 600, cursor: "pointer",
                }}>
                  ดูโปรโมชั่นทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {filtered.map(p => <PromoCard key={p.id} promo={p} />)}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .promo-page { min-height: 100vh; background: transparent; }
        .promo-hero {
          background: linear-gradient(135deg, #7c2d12 0%, #b45309 40%, #dc2626 100%);
          padding: 64px 20px 80px;
          position: relative; overflow: hidden;
        }
        .promo-hero::before {
          content: ""; position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: rgba(255,255,255,0.04);
          top: -200px; right: -200px; pointer-events: none;
        }
        .promo-hero::after {
          content: ""; position: absolute;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(251,191,36,0.10);
          bottom: -100px; left: 10%; pointer-events: none;
        }
        .promo-hero-inner { max-width: 700px; margin: 0 auto; text-align: center; position: relative; z-index: 1; color: #fff; }
        .promo-hero-tag { font-size: 11px; letter-spacing: 3px; font-weight: 800; color: rgba(255,255,255,0.5); margin: 0 0 14px; }
        .promo-hero-title { font-size: 42px; font-weight: 900; color: white; margin: 0 0 14px; line-height: 1.1; }
        .promo-hero-title span { color: #fbbf24; }
        .promo-hero-sub { font-size: 15px; color: rgba(255,255,255,0.65); margin: 0 0 36px; line-height: 1.8; }
        .promo-hero-sub span { font-size: 13px; opacity: 0.75; }
        .promo-hero-deco1 { display: none; }
        .promo-hero-deco2 { display: none; }
        .promo-search-wrap {
          background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
          border-radius: 16px; padding: 16px 20px;
          display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
        }
        .promo-search-input {
          flex: 1 1 180px; min-width: 180px; padding: 10px 16px;
          border-radius: 10px; border: none; font-size: 14px; outline: none;
          background: rgba(255,255,255,0.95);
        }
        .promo-search-select {
          flex: 1 1 150px; min-width: 150px; padding: 10px 16px;
          border-radius: 10px; border: none; font-size: 14px; outline: none;
          background: rgba(255,255,255,0.95);
        }
        .promo-clear-btn {
          padding: 10px 16px; border-radius: 10px; border: none;
          background: rgba(255,255,255,0.3); color: #fff;
          font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
