import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)", borderRadius: 28, padding: "52px 48px", color: "white", marginBottom: 40, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: -80, right: -60, pointerEvents: "none" }} />
        <div style={{ fontSize: 11, letterSpacing: 4, color: "rgba(255,255,255,0.5)", fontWeight: 800, marginBottom: 16, textTransform: "uppercase" }}>เกี่ยวกับเรา · About Us</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 16px", lineHeight: 1.2 }}>
          ไปเล่า<br />
          <span style={{ background: "linear-gradient(90deg,#34d399,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PAI-LAO EXPERIENCE</span>
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, maxWidth: 540, margin: 0 }}>
          ชุมชนนักท่องเที่ยวไทยที่รวบรวมเรื่องเล่า ประสบการณ์ และแรงบันดาลใจการเดินทาง ไว้ในที่เดียว
        </p>
      </div>

      {/* แนวคิด */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
          💡 แนวคิด
        </h2>
        <div style={{ background: "var(--pl-white)", borderRadius: 20, border: "1.5px solid var(--pl-border)", padding: "28px 32px", boxShadow: "0 4px 24px rgba(15,23,42,0.05)", fontSize: 15, color: "var(--pl-text-secondary)", lineHeight: 1.9 }}>
          <p style={{ margin: "0 0 16px" }}>
            ไปเล่าเกิดขึ้นจากความเชื่อที่ว่า <strong>"ทุกการเดินทางมีเรื่องเล่า"</strong> นักท่องเที่ยวไทยมีประสบการณ์มากมายที่ซ่อนอยู่ในความทรงจำ แต่ขาดแพลตฟอร์มที่เหมาะสมในการแบ่งปันอย่างเป็นระบบ
          </p>
          <p style={{ margin: "0 0 16px" }}>
            แทนที่จะเป็นเพียงฐานข้อมูลสถานที่ทั่วไป ไปเล่ามุ่งเน้นให้ผู้ใช้แต่ละคน <strong>เล่าเรื่องราวการเดินทางในแบบของตนเอง</strong> ทั้งเส้นทาง ความประทับใจ เคล็ดลับ และประสบการณ์จริงที่หาไม่ได้จากการค้นหาทั่วไป
          </p>
          <p style={{ margin: 0 }}>
            เราเชื่อว่าเมื่อชุมชนเติบโต ข้อมูลจะยิ่งสมบูรณ์ และนักท่องเที่ยวทุกคนจะได้ประโยชน์จากประสบการณ์ที่แท้จริงของกันและกัน
          </p>
        </div>
      </section>

      {/* ระบบโดยรวม */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
          🏗️ ระบบโดยรวม
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            {
              icon: "🧭",
              title: "ทริปและรีวิว",
              color: "#eff6ff",
              border: "#dbeafe",
              desc: "ผู้ใช้สร้างเรื่องเล่าการเดินทาง พร้อมเส้นทาง รูปภาพ และคำอธิบายแต่ละจุด เนื้อหาทุกชิ้นผ่านการตรวจสอบจากทีมงานก่อนเผยแพร่",
            },
            {
              icon: "📍",
              title: "ฐานข้อมูลสถานที่",
              color: "#f0fdf4",
              border: "#bbf7d0",
              desc: "สถานที่ท่องเที่ยวทั่วไทยกว่า 2,500 จุด ทั้งที่ทีมงานนำเข้าและชุมชนช่วยกันเพิ่ม ครอบคลุมทุกหมวด ทั้งธรรมชาติ คาเฟ่ ที่พัก อาหาร และอีกมาก",
            },
            {
              icon: "🏢",
              title: "ระบบเจ้าของธุรกิจ",
              color: "#fefce8",
              border: "#fde68a",
              desc: "เจ้าของสถานที่สามารถ Claim สถานที่ของตน จัดการข้อมูล ตอบรีวิว และสร้างโปรโมชั่น พร้อมระบบตรวจสอบสิทธิ์โดยแอดมิน",
            },
            {
              icon: "🗺️",
              title: "แพลนเนอร์ทริป",
              color: "#faf5ff",
              border: "#e9d5ff",
              desc: "วางแผนการเดินทางส่วนตัว เพิ่มจุดหมาย กำหนดวัน-เวลา และแชร์แผนให้เพื่อนได้ผ่านลิงก์สาธารณะ",
            },
            {
              icon: "🎯",
              title: "ภารกิจและแต้ม",
              color: "#fff7ed",
              border: "#fed7aa",
              desc: "ระบบ Gamification ให้ผู้ใช้รับภารกิจ เช่น เยี่ยมสถานที่ รีวิว หรือแชร์ทริป เพื่อรับแต้มและ Badge สะสม",
            },
            {
              icon: "🎁",
              title: "โปรโมชั่น",
              color: "#fef2f2",
              border: "#fecaca",
              desc: "เจ้าของธุรกิจส่งโปรโมชั่นเพื่อให้ทีมงานอนุมัติและแสดงในหน้า Deals ช่วยดึงดูดนักท่องเที่ยวให้เข้าหาสถานที่",
            },
          ].map(item => (
            <div key={item.title} style={{ background: item.color, borderRadius: 16, border: `1.5px solid ${item.border}`, padding: "20px 22px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--pl-text-primary)", marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "var(--pl-text-secondary)", lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ค่านิยม */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--pl-text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
          🌱 สิ่งที่เราเชื่อ
        </h2>
        <div style={{ background: "var(--pl-white)", borderRadius: 20, border: "1.5px solid var(--pl-border)", padding: "28px 32px", boxShadow: "0 4px 24px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { icon: "🤝", title: "ชุมชนมาก่อน", desc: "ไปเล่าดีขึ้นได้เพราะผู้ใช้ทุกคน ทั้งการเพิ่มสถานที่ เขียนรีวิว และแบ่งปันทริป คือสิ่งที่ทำให้แพลตฟอร์มนี้มีคุณค่า" },
              { icon: "✅", title: "ข้อมูลที่เชื่อถือได้", desc: "เนื้อหาทุกชิ้นผ่านการตรวจสอบ เจ้าของธุรกิจต้องได้รับการอนุมัติก่อน Claim สถานที่ เพื่อให้ข้อมูลมีความน่าเชื่อถือสูงสุด" },
              { icon: "🔍", title: "โปร่งใสและยุติธรรม", desc: "ระบบโต้แย้งความเป็นเจ้าของ การตรวจสอบโดยแอดมิน และบันทึกกิจกรรมทุกอย่าง เพื่อให้ทุกฝ่ายได้รับความเป็นธรรม" },
            ].map(v => (
              <div key={v.title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--pl-text-primary)", marginBottom: 4 }}>{v.title}</div>
                  <div style={{ fontSize: 14, color: "var(--pl-text-secondary)", lineHeight: 1.7 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 20, padding: "36px 32px", textAlign: "center", color: "white" }}>
        <h3 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 10px" }}>พร้อมเริ่มต้นแล้วใช่ไหม?</h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 24px" }}>ร่วมเป็นส่วนหนึ่งของชุมชนไปเล่า และแบ่งปันเรื่องราวการเดินทางของคุณ</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ padding: "12px 28px", background: "#10b981", color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
            สมัครสมาชิก
          </Link>
          <Link href="/contact" style={{ padding: "12px 28px", background: "rgba(255,255,255,0.12)", color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)" }}>
            ติดต่อเรา
          </Link>
        </div>
      </div>
    </div>
  );
}
