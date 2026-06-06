"use client";
import { useEffect, useState } from "react";

// ─── types ───────────────────────────────────────────────────────────────────

interface Stats {
  users: { total: number; traveler: number; business: number; admin: number; superadmin: number };
  trips: { total: number; published: number; draft: number };
  places: { total: number; verified: number; unverified: number };
  reviews: { total: number; replies: number };
  reports: { pending: number; total: number };
  engagement: { bookmarks: number; likes: number };
  topTrips: any[];
  topPlaces: any[];
}

interface DataPoint { date: string; count: number }
interface TimeSeries {
  signups: DataPoint[];
  logins:  DataPoint[];
  trips:   DataPoint[];
  places:  DataPoint[];
  reviews: DataPoint[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fill30Days(series: DataPoint[]): DataPoint[] {
  const map = Object.fromEntries(series.map(d => [d.date, d.count]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: map[key] ?? 0 };
  });
}

function trend(filled: DataPoint[]) {
  const last7 = filled.slice(-7).reduce((s, d) => s + d.count, 0);
  const prev7 = filled.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);
  return { last7, prev7, delta };
}

// ─── components ──────────────────────────────────────────────────────────────

function Bar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.78rem" }}>
        <span style={{ color: "#cbd5e1" }}>{label}</span>
        <span style={{ color: "#94a3b8", fontWeight: 600 }}>{val.toLocaleString()}</span>
      </div>
      <div style={{ height: 8, background: "#1e293b", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function SparkBars({ data, color }: { data: DataPoint[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 300, H = 52;
  const gap = 2;
  const barW = (W - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const bh = d.count > 0 ? Math.max((d.count / max) * H, 3) : 0;
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={H - bh}
            width={barW}
            height={bh}
            fill={color}
            rx={1.5}
            opacity={0.82}
          />
        );
      })}
    </svg>
  );
}

function TrendChip({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", fontWeight: 700,
      color: up ? "#34d399" : "#f87171",
      background: up ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
      borderRadius: 99, padding: "2px 8px",
    }}>
      {up ? "▲" : "▼"} {Math.abs(delta)}%
      <span style={{ color: "#64748b", fontWeight: 400 }}>vs สัปดาห์ก่อน</span>
    </span>
  );
}

interface SparkCardProps {
  icon: string;
  title: string;
  titleEn: string;
  data: DataPoint[];
  color: string;
}

function SparkCard({ icon, title, titleEn, data, color }: SparkCardProps) {
  const filled = fill30Days(data);
  const total  = filled.reduce((s, d) => s + d.count, 0);
  const today  = filled[filled.length - 1].count;
  const { delta } = trend(filled);

  return (
    <div style={{
      background: "#0f172a", borderRadius: 14, padding: "18px 18px 14px",
      border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{title}</div>
            <div style={{ fontSize: "0.65rem", color: "#64748b", letterSpacing: "0.04em" }}>{titleEn}</div>
          </div>
        </div>
        <TrendChip delta={delta} />
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "1.7rem", fontWeight: 900, color, lineHeight: 1 }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 2 }}>รวม 30 วัน</div>
        </div>
        <div style={{ borderLeft: "1px solid #1e293b", paddingLeft: 16 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#e2e8f0", lineHeight: 1 }}>{today.toLocaleString()}</div>
          <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 2 }}>วันนี้</div>
        </div>
      </div>

      <SparkBars data={filled} color={color} />

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "#475569" }}>
        <span>30 วันที่แล้ว</span>
        <span>วันนี้</span>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const CAT_COLORS = ["#4facfe","#43e97b","#f59e0b","#a78bfa","#22d3ee","#f87171","#34d399","#fb923c","#c084fc","#60a5fa"];

export default function AdminAnalyticsPage() {
  const [stats,   setStats  ] = useState<Stats | null>(null);
  const [series,  setSeries ] = useState<TimeSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/admin/analytics").then(r => r.json()),
    ]).then(([s, a]) => {
      setStats(s);
      setSeries(a);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="adm-content"><div className="adm-empty">⏳ กำลังโหลด Analytics...</div></div>;
  if (!stats || !series) return <div className="adm-content"><div className="adm-empty">โหลดข้อมูลไม่สำเร็จ</div></div>;

  const { users, trips, places, reviews, engagement, topTrips, topPlaces } = stats;
  const maxTrip  = topTrips[0]?._count?.likes   || 1;
  const maxPlace = topPlaces[0]?._count?.reviews || 1;

  const contentSeries: DataPoint[] = (() => {
    const map: Record<string, number> = {};
    [...series.trips, ...series.places, ...series.reviews].forEach(d => {
      map[d.date] = (map[d.date] ?? 0) + d.count;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  })();

  return (
    <>
      <div className="adm-topbar">
        <div className="adm-topbar-title">📊 Analytics & รายงาน</div>
      </div>

      <div className="adm-content">

        {/* ── Overview numbers ── */}
        <div className="adm-stats-grid" style={{ marginBottom: 28 }}>
          <div className="adm-stat blue">
            <div className="adm-stat-icon">👥</div>
            <div className="adm-stat-val">{users.total.toLocaleString()}</div>
            <div className="adm-stat-label">ผู้ใช้ทั้งหมด</div>
          </div>
          <div className="adm-stat green">
            <div className="adm-stat-icon">🗺️</div>
            <div className="adm-stat-val">{trips.total.toLocaleString()}</div>
            <div className="adm-stat-label">ทริปทั้งหมด</div>
          </div>
          <div className="adm-stat cyan">
            <div className="adm-stat-icon">📍</div>
            <div className="adm-stat-val">{places.total.toLocaleString()}</div>
            <div className="adm-stat-label">สถานที่ทั้งหมด</div>
          </div>
          <div className="adm-stat amber">
            <div className="adm-stat-icon">⭐</div>
            <div className="adm-stat-val">{reviews.total.toLocaleString()}</div>
            <div className="adm-stat-label">รีวิวทั้งหมด</div>
          </div>
          <div className="adm-stat purple">
            <div className="adm-stat-icon">❤️</div>
            <div className="adm-stat-val">{engagement.likes.toLocaleString()}</div>
            <div className="adm-stat-label">ยอดถูกใจรวม</div>
          </div>
          <div className="adm-stat green">
            <div className="adm-stat-icon">🔖</div>
            <div className="adm-stat-val">{engagement.bookmarks.toLocaleString()}</div>
            <div className="adm-stat-label">บุ๊กมาร์กรวม</div>
          </div>
        </div>

        {/* ── 30-day time-series ── */}
        <div className="adm-card" style={{ marginBottom: 24 }}>
          <div className="adm-card-head">
            <span className="adm-card-title">📅 กิจกรรม 30 วันที่ผ่านมา</span>
          </div>
          <div className="adm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              <SparkCard icon="👥" title="ผู้ใช้ใหม่"      titleEn="New Registrations"           data={series.signups} color="#4facfe" />
              <SparkCard icon="🔑" title="ล็อกอินสำเร็จ"   titleEn="Successful Logins"            data={series.logins}  color="#43e97b" />
              <SparkCard icon="📝" title="คอนเทนต์ใหม่"    titleEn="Trips + Places + Reviews"     data={contentSeries}  color="#f59e0b" />
              <SparkCard icon="🗺️" title="ทริปใหม่"        titleEn="New Trips Created"             data={series.trips}   color="#a78bfa" />
              <SparkCard icon="📍" title="สถานที่ใหม่"     titleEn="New Places Added"              data={series.places}  color="#22d3ee" />
              <SparkCard icon="⭐" title="รีวิวใหม่"        titleEn="New Reviews"                  data={series.reviews} color="#f9a8d4" />
            </div>
          </div>
        </div>

        {/* ── User + Content health ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">👥 สัดส่วนผู้ใช้</span></div>
            <div className="adm-card-body">
              <Bar label={`นักรีวิว (${users.traveler})`}     val={users.traveler}   max={users.total} color="#4facfe" />
              <Bar label={`ธุรกิจ (${users.business})`}       val={users.business}   max={users.total} color="#f59e0b" />
              <Bar label={`แอดมิน (${users.admin})`}          val={users.admin}      max={users.total} color="#2563eb" />
              <Bar label={`Superadmin (${users.superadmin})`} val={users.superadmin} max={users.total} color="#7c3aed" />
              <div style={{ marginTop: 16, padding: "12px", background: "#0f172a", borderRadius: 8 }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 8 }}>สัดส่วน</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "นักรีวิว", val: users.traveler, color: "#4facfe" },
                    { label: "ธุรกิจ",   val: users.business, color: "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ fontSize: "0.78rem" }}>
                      <span style={{ color: item.color, fontWeight: 700 }}>
                        {users.total > 0 ? Math.round(item.val / users.total * 100) : 0}%
                      </span>
                      <span style={{ color: "#64748b" }}> {item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🗺️ สถานะทริป</span></div>
            <div className="adm-card-body">
              <Bar label={`เผยแพร่ (${trips.published})`} val={trips.published} max={trips.total} color="#43e97b" />
              <Bar label={`แบบร่าง (${trips.draft})`}     val={trips.draft}     max={trips.total} color="#475569" />
              <div style={{ marginTop: 20, padding: "12px", background: "#0f172a", borderRadius: 8 }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>อัตราการเผยแพร่</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#43e97b", lineHeight: 1.2, marginTop: 4 }}>
                  {trips.total > 0 ? Math.round(trips.published / trips.total * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">📍 สถานะสถานที่</span></div>
            <div className="adm-card-body">
              <Bar label={`ยืนยันแล้ว (${places.verified})`}  val={places.verified}   max={places.total} color="#22d3ee" />
              <Bar label={`รอยืนยัน (${places.unverified})`}  val={places.unverified} max={places.total} color="#f59e0b" />
              <div style={{ marginTop: 20, padding: "12px", background: "#0f172a", borderRadius: 8 }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>อัตราการยืนยัน</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#22d3ee", lineHeight: 1.2, marginTop: 4 }}>
                  {places.total > 0 ? Math.round(places.verified / places.total * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top rankings ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 Top Trips — ยอดถูกใจ</span></div>
            <div className="adm-card-body">
              {topTrips.map((t, i) => (
                <div key={t.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? "#713f12" : i === 1 ? "#334155" : i === 2 ? "#431407" : "#1e293b",
                      color:      i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#fb923c" : "#64748b",
                      fontSize: "0.68rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    <span style={{ fontSize: "0.72rem", color: "#f9a8d4", whiteSpace: "nowrap" }}>❤️ {t._count.likes}</span>
                  </div>
                  <div style={{ marginLeft: 30 }}>
                    <Bar label="" val={t._count.likes} max={maxTrip} color={CAT_COLORS[i % CAT_COLORS.length]} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-card-head"><span className="adm-card-title">🏆 Top Places — ยอดรีวิว</span></div>
            <div className="adm-card-body">
              {topPlaces.map((p, i) => (
                <div key={p.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? "#713f12" : i === 1 ? "#334155" : i === 2 ? "#431407" : "#1e293b",
                      color:      i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#fb923c" : "#64748b",
                      fontSize: "0.68rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                    <span style={{ fontSize: "0.72rem", color: "#fde68a", whiteSpace: "nowrap" }}>⭐ {p._count.reviews}</span>
                  </div>
                  <div style={{ marginLeft: 30 }}>
                    <Bar label="" val={p._count.reviews} max={maxPlace} color={CAT_COLORS[i % CAT_COLORS.length]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Engagement summary ── */}
        <div className="adm-card">
          <div className="adm-card-head"><span className="adm-card-title">📈 ภาพรวม Engagement</span></div>
          <div className="adm-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {[
                { icon: "❤️", label: "ยอดถูกใจทริป + สถานที่", val: engagement.likes,     color: "#f9a8d4" },
                { icon: "🔖", label: "บุ๊กมาร์กทั้งหมด",        val: engagement.bookmarks, color: "#67e8f9" },
                { icon: "⭐", label: "รีวิวทั้งหมด",             val: reviews.total,        color: "#fde68a" },
                { icon: "💬", label: "ความคิดเห็น",              val: reviews.replies,      color: "#a5f3fc" },
              ].map(item => (
                <div key={item.label} style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: "1.4rem" }}>{item.icon}</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: item.color, lineHeight: 1.2, marginTop: 6 }}>{item.val.toLocaleString()}</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
