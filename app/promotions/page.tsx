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
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        select:focus, input:focus { outline: 2px solid #f59e0b; }
      `}</style>

      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "56px 24px 48px", textAlign: "center", color: "#fff",
      }}>
        {/* BG image + warm overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/hero-bg.png')", backgroundSize: "cover", backgroundPosition: "center 60%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(146,64,14,0.88) 0%, rgba(180,83,9,0.85) 30%, rgba(217,119,6,0.82) 60%, rgba(239,68,68,0.80) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "absolute", top: -80, right: -80, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, opacity: 0.7, textTransform: "uppercase", marginBottom: 8 }}>SPECIAL DEALS</div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 8px", textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
            โปรโมชั่นวันนี้
          </h1>
          <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.75, marginBottom: 10 }}>Today&apos;s Promotions</div>
          <p style={{ fontSize: 15, opacity: 0.9, margin: "0 0 32px" }}>
            ดีลพิเศษจากร้านค้าและสถานที่ท่องเที่ยวทั่วไทย<br />
            <span style={{ fontSize: 13, opacity: 0.75 }}>Exclusive deals from businesses across Thailand</span>
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

          {/* Search bar */}
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อโปรโมชั่น, ร้าน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: "1 1 180px", minWidth: 180, padding: "10px 16px",
                borderRadius: 10, border: "none",
                fontSize: 14, outline: "none",
                background: "rgba(255,255,255,0.95)",
              }}
            />
            <select
              value={province}
              onChange={e => { setProvince(e.target.value); setDistrict(""); }}
              style={{
                flex: "1 1 150px", minWidth: 150, padding: "10px 16px",
                borderRadius: 10, border: "none",
                fontSize: 14, outline: "none",
                background: "rgba(255,255,255,0.95)",
                color: province ? "#111827" : "#9ca3af",
              }}
            >
              <option value="">ทุกจังหวัด</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              disabled={!province}
              style={{
                flex: "1 1 150px", minWidth: 150, padding: "10px 16px",
                borderRadius: 10, border: "none",
                fontSize: 14, outline: "none",
                background: "rgba(255,255,255,0.95)",
                color: district ? "#111827" : "#9ca3af",
                opacity: province ? 1 : 0.6,
                cursor: province ? "pointer" : "not-allowed",
              }}
            >
              <option value="">{province ? "ทุกอำเภอ" : "เลือกจังหวัดก่อน"}</option>
              {province && getDistricts(province).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(province || district || search) && (
              <button
                onClick={() => { setProvince(""); setDistrict(""); setSearch(""); }}
                style={{
                  padding: "10px 16px", borderRadius: 10, border: "none",
                  background: "rgba(255,255,255,0.3)", color: "#fff",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ล้างตัวกรอง ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ minHeight: "60vh", background: "#f8fafb", padding: "32px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Result label */}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20, animation: "fadeIn 0.4s ease" }}>
              {filtered.map(p => <PromoCard key={p.id} promo={p} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
