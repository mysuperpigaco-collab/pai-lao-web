"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const LAST_UPDATED = "21 พฤษภาคม 2568";
const SITE_NAME    = "ไปเล่า (PAI-LAO EXPERIENCE)";
const CONTACT_EMAIL = "support@pai-lao.com";

type Tab = "terms" | "privacy" | "community";

function PolicyPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "terms";
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t) setTab(t);
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--pl-bg)" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0369a1 100%)",
        padding: "60px 24px 48px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.5rem,4vw,2.2rem)", margin: "0 0 10px" }}>
          นโยบายและข้อกำหนด
        </h1>
        <p style={{ color: "var(--pl-text-muted)", fontSize: 15, margin: "0 0 6px" }}>
          Terms, Privacy &amp; Community Standards · {SITE_NAME}
        </p>
        <p style={{ color: "var(--pl-text-secondary)", fontSize: 13, margin: 0 }}>
          อัปเดตล่าสุด: {LAST_UPDATED}
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        background: "var(--pl-white)", borderBottom: "1px solid var(--pl-border)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{
          maxWidth: 860, margin: "0 auto", padding: "0 24px",
          display: "flex", gap: 4,
        }}>
          {([
            ["terms",     "📜 ข้อกำหนดการใช้งาน"],
            ["privacy",   "🔒 นโยบายความเป็นส่วนตัว"],
            ["community", "🤝 มาตรฐานชุมชน"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "14px 18px", border: "none", background: "none",
              fontFamily: "inherit", fontSize: 14, fontWeight: tab === id ? 700 : 500,
              color: tab === id ? "#0369a1" : "#64748b",
              borderBottom: `3px solid ${tab === id ? "#0369a1" : "transparent"}`,
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 40px" }}>

        {/* ════════════════════════════════════════
            TAB 1 — ข้อกำหนดการใช้งาน (Terms of Service)
            ════════════════════════════════════════ */}
        {tab === "terms" && (
          <div>
            <Section icon="📌" title="1. การยอมรับข้อกำหนด">
              <p>
                การเข้าใช้งานเว็บไซต์ <strong>{SITE_NAME}</strong> ("แพลตฟอร์ม") ถือว่าท่านได้อ่าน
                เข้าใจ และตกลงผูกพันตามข้อกำหนดการใช้งานฉบับนี้ทุกประการ
                หากท่านไม่ยอมรับข้อกำหนดใดๆ กรุณาหยุดใช้งานแพลตฟอร์มทันที
              </p>
              <p>
                ไปเล่าขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ทุกเมื่อโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                การใช้งานต่อเนื่องหลังจากการแก้ไขถือว่าท่านยอมรับข้อกำหนดที่แก้ไขแล้ว
              </p>
            </Section>

            <Section icon="👤" title="2. คุณสมบัติผู้ใช้งาน">
              <p>ท่านต้องมีคุณสมบัติดังต่อไปนี้จึงจะสามารถใช้งานแพลตฟอร์มได้:</p>
              <BulletList items={[
                "มีอายุ 13 ปีขึ้นไป (ผู้ที่อายุต่ำกว่า 18 ปี ต้องได้รับความยินยอมจากผู้ปกครอง)",
                "ลงทะเบียนด้วยข้อมูลที่ถูกต้องและเป็นความจริง",
                "ไม่เคยถูกระงับหรือยกเลิกบัญชีโดยไปเล่ามาก่อน",
                "ไม่ฝ่าฝืนกฎหมายของประเทศไทยหรือประเทศที่ท่านพำนักอยู่",
              ]} />
            </Section>

            <Section icon="📝" title="3. บัญชีผู้ใช้และความรับผิดชอบ">
              <p>
                ท่านมีหน้าที่รับผิดชอบต่อความปลอดภัยของบัญชีและรหัสผ่านของตนเอง
                กิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของท่านถือเป็นความรับผิดชอบของท่าน
              </p>
              <BulletList items={[
                "ห้ามแชร์รหัสผ่านหรืออนุญาตให้ผู้อื่นใช้บัญชีของท่าน",
                "ต้องแจ้งทีมงานทันทีหากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต",
                "ไปเล่าจะไม่รับผิดชอบต่อความสูญเสียใดๆ ที่เกิดจากการไม่รักษาความปลอดภัยของบัญชี",
                "แต่ละบุคคลสามารถมีบัญชีผู้ใช้ได้เพียง 1 บัญชีเท่านั้น",
              ]} />
            </Section>

            <Section icon="🗺️" title="4. เนื้อหาของผู้ใช้ (User-Generated Content)">
              <p>
                เมื่อท่านโพสต์ อัปโหลด หรือแชร์เนื้อหาบนแพลตฟอร์ม
                ท่านยังคงเป็นเจ้าของสิทธิ์ในเนื้อหานั้น แต่ท่านให้สิทธิ์แก่ไปเล่า
                ในการใช้งาน แสดง ทำซ้ำ และเผยแพร่เนื้อหาดังกล่าวเพื่อการดำเนินงานและส่งเสริมแพลตฟอร์ม
              </p>
              <p><strong>ท่านรับประกันว่าเนื้อหาที่โพสต์:</strong></p>
              <BulletList items={[
                "เป็นผลงานต้นฉบับของท่านหรือท่านมีสิทธิ์นำมาเผยแพร่",
                "ไม่ละเมิดลิขสิทธิ์ สิทธิบัตร หรือทรัพย์สินทางปัญญาของผู้อื่น",
                "ไม่มีเนื้อหาที่เป็นเท็จ หมิ่นประมาท หรือก่อให้เกิดความเสียหายต่อผู้อื่น",
                "ผ่านการอนุมัติจากแอดมินก่อนเผยแพร่สู่สาธารณะ (สำหรับเรื่องราวทริป)",
              ]} />
            </Section>

            <Section icon="🚫" title="5. พฤติกรรมต้องห้าม">
              <p>ท่านตกลงจะไม่กระทำการดังต่อไปนี้บนแพลตฟอร์ม:</p>
              <BulletList items={[
                "โพสต์เนื้อหาที่ผิดกฎหมาย ลามกอนาจาร หรือละเมิดสิทธิมนุษยชน",
                "คุกคาม ข่มขู่ หรือกลั่นแกล้งผู้ใช้คนอื่น",
                "สแปม โฆษณา หรือโปรโมทสินค้า/บริการโดยไม่ได้รับอนุญาต",
                "พยายามเข้าถึงระบบหรือบัญชีของผู้อื่นโดยไม่ได้รับอนุญาต",
                "ใช้บอทหรือระบบอัตโนมัติในการสร้างเนื้อหาหรือโต้ตอบ",
                "เผยแพร่ข้อมูลส่วนตัวของผู้อื่นโดยไม่ได้รับความยินยอม",
                "ปลอมแปลงตัวตนหรือแอบอ้างเป็นบุคคลหรือองค์กรอื่น",
                "กระทำการใดๆ ที่ขัดต่อกฎหมายไทยหรือมาตรฐานสากล",
              ]} />
            </Section>

            <Section icon="⚖️" title="6. มาตรการบังคับใช้และโทษ">
              <p>
                ไปเล่าขอสงวนสิทธิ์ในการดำเนินมาตรการต่างๆ เมื่อพบการละเมิดข้อกำหนด ดังนี้:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, margin: "16px 0" }}>
                {[
                  ["⚠️ คำเตือน", "การแจ้งเตือนครั้งแรก บันทึกในระบบ"],
                  ["🔇 ห้ามโพส", "ระงับการสร้างเนื้อหาชั่วคราว 1–90 วัน"],
                  ["🚫 ระงับบัญชี", "ไม่สามารถเข้าสู่ระบบได้ชั่วคราวหรือถาวร"],
                  ["🗑️ ลบเนื้อหา", "ลบโพสต์ รีวิว หรือความคิดเห็นที่ละเมิด"],
                ].map(([title, desc]) => (
                  <div key={title} style={{
                    background: "var(--pl-bg)", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid var(--pl-border)",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>{desc}</div>
                  </div>
                ))}
              </div>
              <p>
                มาตรการขึ้นอยู่กับความรุนแรงและความถี่ของการละเมิด
                ท่านมีสิทธิ์อุทธรณ์ผลการตัดสินใจโดยติดต่อทีมงาน
              </p>
            </Section>

            <Section icon="💼" title="7. ประเภทบัญชีธุรกิจ">
              <p>บัญชีประเภท Business มีเงื่อนไขเพิ่มเติม:</p>
              <BulletList items={[
                "ต้องเป็นธุรกิจที่มีการดำเนินงานจริงและสามารถยืนยันตัวตนได้",
                "ข้อมูลสถานที่ (ชื่อ ที่ตั้ง ราคา) ต้องถูกต้องและอัปเดตสม่ำเสมอ",
                "ห้ามสร้างรีวิวปลอมหรือจ้างให้ผู้อื่นเขียนรีวิวให้",
                "ไปเล่าขอสงวนสิทธิ์ยกเลิกบัญชีธุรกิจหากพบการกระทำที่ไม่ซื่อสัตย์",
              ]} />
            </Section>

            <Section icon="⚡" title="8. การจำกัดความรับผิด">
              <p>
                ไปเล่าให้บริการแพลตฟอร์ม "ตามสภาพที่เป็น" (as-is) โดยไม่รับประกันความถูกต้อง
                ครบถ้วน หรือความต่อเนื่องในการให้บริการ ไปเล่าจะไม่รับผิดชอบต่อ:
              </p>
              <BulletList items={[
                "ความสูญเสียหรือเสียหายที่เกิดจากการใช้หรือไม่สามารถใช้แพลตฟอร์มได้",
                "เนื้อหาที่ผู้ใช้โพสต์ ซึ่งไม่ใช่เนื้อหาของไปเล่า",
                "ข้อผิดพลาดในข้อมูลสถานที่ท่องเที่ยวที่ผู้ประกอบการกรอก",
                "การสูญหายของข้อมูลอันเนื่องมาจากเหตุสุดวิสัย",
              ]} />
            </Section>

            <Section icon="⚖️" title="9. กฎหมายที่ใช้บังคับ">
              <p>
                ข้อกำหนดฉบับนี้อยู่ภายใต้บังคับและตีความตามกฎหมายของ<strong>ประเทศไทย</strong>
                ข้อพิพาทใดๆ ที่เกิดขึ้นให้อยู่ในเขตอำนาจศาลที่มีเขตอำนาจในประเทศไทย
              </p>
            </Section>

            <Section icon="📬" title="10. ติดต่อเรา">
              <p>
                หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อ:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#0369a1", fontWeight: 600 }}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </Section>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 — นโยบายความเป็นส่วนตัว (Privacy Policy)
            ════════════════════════════════════════ */}
        {tab === "privacy" && (
          <div>
            <Section icon="🔍" title="1. ข้อมูลที่เราเก็บรวบรวม">
              <p>เราเก็บรวบรวมข้อมูลดังต่อไปนี้เพื่อให้บริการแพลตฟอร์ม:</p>

              <SubSection title="ข้อมูลที่ท่านให้โดยตรง">
                <BulletList items={[
                  "ข้อมูลบัญชี: ชื่อ อีเมล รหัสผ่าน (เข้ารหัสด้วย bcrypt) เบอร์โทรศัพท์",
                  "โปรไฟล์: ชื่อที่แสดง ชีวประวัติ รูปโปรไฟล์ จังหวัด",
                  "เนื้อหา: เรื่องราวทริป รีวิว ความคิดเห็น รูปภาพที่อัปโหลด",
                  "ข้อมูลธุรกิจ: ชื่อธุรกิจ ที่อยู่ ข้อมูลติดต่อ (สำหรับบัญชี Business)",
                ]} />
              </SubSection>

              <SubSection title="ข้อมูลที่เก็บโดยอัตโนมัติ">
                <BulletList items={[
                  "ข้อมูลการใช้งาน: หน้าที่เยี่ยมชม จำนวนครั้งดู ลิงก์ที่คลิก",
                  "ข้อมูลอุปกรณ์: ประเภทอุปกรณ์ ระบบปฏิบัติการ เบราว์เซอร์",
                  "ข้อมูล Log: เวลาเข้าถึง IP Address (สำหรับความปลอดภัย)",
                ]} />
              </SubSection>
            </Section>

            <Section icon="🎯" title="2. วัตถุประสงค์การใช้ข้อมูล">
              <p>เราใช้ข้อมูลของท่านเพื่อวัตถุประสงค์ดังนี้เท่านั้น:</p>
              <div style={{ display: "grid", gap: 10, margin: "12px 0" }}>
                {[
                  ["🔐 การยืนยันตัวตน", "เพื่อสร้าง จัดการ และรักษาความปลอดภัยบัญชีของท่าน"],
                  ["✨ การให้บริการ", "เพื่อแสดงเนื้อหา ประมวลผลการโต้ตอบ และปรับแต่งประสบการณ์"],
                  ["💬 การสื่อสาร", "เพื่อส่งการแจ้งเตือน อัปเดตระบบ และข้อมูลสำคัญ"],
                  ["🛡️ ความปลอดภัย", "เพื่อตรวจจับและป้องกันการฉ้อโกง การใช้งานที่ไม่เหมาะสม"],
                  ["📊 การพัฒนา", "เพื่อวิเคราะห์การใช้งานและปรับปรุงแพลตฟอร์ม"],
                ].map(([icon_title, desc]) => (
                  <div key={icon_title} style={{
                    display: "flex", gap: 14, padding: "12px 16px",
                    background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd",
                    alignItems: "flex-start",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, minWidth: 160, color: "#0369a1" }}>{icon_title}</div>
                    <div style={{ fontSize: 14, color: "var(--pl-text-secondary)" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon="🤝" title="3. การเปิดเผยข้อมูลแก่บุคคลที่สาม">
              <p><strong>เราไม่ขายข้อมูลส่วนตัวของท่านให้แก่บุคคลที่สาม</strong> เราอาจเปิดเผยข้อมูลในกรณีดังนี้:</p>
              <BulletList items={[
                "ผู้ให้บริการโครงสร้างพื้นฐาน (Supabase, Vercel) ซึ่งผูกพันตามสัญญาการประมวลผลข้อมูล",
                "เมื่อได้รับคำสั่งจากหน่วยงานรัฐที่มีอำนาจตามกฎหมาย",
                "เพื่อปกป้องสิทธิ์ ทรัพย์สิน หรือความปลอดภัยของไปเล่าและผู้ใช้",
                "ในกรณีควบรวมกิจการ โดยจะแจ้งให้ท่านทราบล่วงหน้า",
              ]} />
            </Section>

            <Section icon="🔒" title="4. ความปลอดภัยของข้อมูล">
              <p>เราใช้มาตรการรักษาความปลอดภัยมาตรฐานอุตสาหกรรม:</p>
              <BulletList items={[
                "รหัสผ่านเข้ารหัสด้วย bcrypt (ไม่เก็บรหัสผ่านจริง)",
                "การรับส่งข้อมูลเข้ารหัสด้วย HTTPS/TLS",
                "JWT Token มีอายุจำกัดและต่ออายุอัตโนมัติ",
                "ฐานข้อมูลบน Supabase ที่มีการสำรองข้อมูลและ Row-Level Security",
                "บันทึก Admin Logs ทุกการกระทำของผู้ดูแลระบบ",
              ]} />
              <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14, marginTop: 12 }}>
                ⚠️ แม้เราจะใช้มาตรการรักษาความปลอดภัยอย่างเต็มที่
                ท่านควรระมัดระวังในการแชร์ข้อมูลส่วนตัวบนแพลตฟอร์มสาธารณะด้วยเช่นกัน
              </p>
            </Section>

            <Section icon="⏰" title="5. ระยะเวลาการเก็บรักษาข้อมูล">
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["ข้อมูลบัญชีผู้ใช้", "ตลอดอายุบัญชี + 1 ปีหลังลบบัญชี"],
                  ["เนื้อหาที่โพสต์", "จนกว่าท่านจะลบ หรือจนกว่าแอดมินจะลบตามนโยบาย"],
                  ["ข้อมูล Log ความปลอดภัย", "90 วัน"],
                  ["ข้อมูลการวิเคราะห์ (Analytics)", "24 เดือน ในรูปแบบไม่ระบุตัวตน"],
                ].map(([type, duration]) => (
                  <div key={type} style={{
                    display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
                    padding: "10px 14px", background: "var(--pl-bg)", borderRadius: 8,
                    border: "1px solid var(--pl-border)", fontSize: 14,
                  }}>
                    <span style={{ color: "var(--pl-text-primary)", fontWeight: 600 }}>{type}</span>
                    <span style={{ color: "var(--pl-text-secondary)" }}>{duration}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon="🙋" title="6. สิทธิ์ของท่านในฐานะเจ้าของข้อมูล">
              <p>ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ท่านมีสิทธิ์:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, margin: "12px 0" }}>
                {[
                  ["👁️ สิทธิ์เข้าถึง", "ขอดูข้อมูลส่วนตัวที่เราเก็บไว้"],
                  ["✏️ สิทธิ์แก้ไข", "แก้ไขข้อมูลที่ไม่ถูกต้องในโปรไฟล์"],
                  ["🗑️ สิทธิ์ลบ", "ขอลบบัญชีและข้อมูลส่วนตัว"],
                  ["📦 สิทธิ์โอนย้าย", "ขอรับข้อมูลในรูปแบบที่อ่านได้"],
                  ["⛔ สิทธิ์คัดค้าน", "คัดค้านการประมวลผลในบางกรณี"],
                  ["🔁 สิทธิ์ถอนความยินยอม", "ถอนความยินยอมได้ทุกเมื่อ"],
                ].map(([title, desc]) => (
                  <div key={title} style={{
                    background: "var(--pl-bg)", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid var(--pl-border)",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--pl-text-secondary)" }}>{desc}</div>
                  </div>
                ))}
              </div>
              <p>
                ใช้สิทธิ์ได้โดยติดต่อ:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#0369a1", fontWeight: 600 }}>
                  {CONTACT_EMAIL}
                </a>{" "}
                เราจะตอบกลับภายใน 30 วันทำการ
              </p>
            </Section>

            <Section icon="🍪" title="7. คุกกี้และการติดตาม">
              <p>แพลตฟอร์มใช้คุกกี้ประเภทดังนี้:</p>
              <BulletList items={[
                "คุกกี้จำเป็น (Strictly Necessary): สำหรับการล็อกอินและความปลอดภัย — ไม่สามารถปฏิเสธได้",
                "คุกกี้ประสิทธิภาพ (Performance): วิเคราะห์การใช้งานเพื่อปรับปรุงบริการ",
                "ท่านสามารถตั้งค่าคุกกี้ผ่านเบราว์เซอร์ แต่อาจกระทบการใช้งานบางส่วน",
              ]} />
            </Section>

            <Section icon="🌍" title="8. การโอนข้อมูลระหว่างประเทศ">
              <p>
                ข้อมูลของท่านอาจถูกจัดเก็บในเซิร์ฟเวอร์ที่อยู่นอกประเทศไทย (Supabase/Vercel)
                ซึ่งอยู่ภายใต้สัญญาและมาตรฐานการคุ้มครองข้อมูลที่เทียบเท่าหรือสูงกว่า PDPA
              </p>
            </Section>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 3 — มาตรฐานชุมชน (Community Standards)
            ════════════════════════════════════════ */}
        {tab === "community" && (
          <div>
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border: "1px solid #86efac",
              borderRadius: 16, padding: "20px 24px", marginBottom: 32,
            }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#166534", marginBottom: 8 }}>
                🌟 หัวใจของชุมชนไปเล่า
              </div>
              <p style={{ color: "#166534", margin: 0, lineHeight: 1.7, fontSize: 15 }}>
                ไปเล่าคือพื้นที่ปลอดภัยสำหรับนักเดินทางทุกคนที่อยากแบ่งปันประสบการณ์
                เราเชื่อในความจริงใจ ความเคารพ และการสร้างแรงบันดาลใจซึ่งกันและกัน
              </p>
            </div>

            <Section icon="✅" title="1. เนื้อหาที่ส่งเสริม">
              <BulletList variant="green" items={[
                "เรื่องราวการเดินทางที่จริงและมาจากประสบการณ์ตรง",
                "รีวิวที่ซื่อสัตย์และเป็นประโยชน์ต่อนักเดินทางคนอื่น",
                "รูปภาพและวิดีโอที่ถ่ายเอง ไม่ละเมิดลิขสิทธิ์",
                "ข้อมูลสถานที่ที่ถูกต้อง ช่วยให้ผู้อื่นวางแผนได้",
                "การแบ่งปันเคล็ดลับ ทิปส์ และข้อแนะนำที่เป็นประโยชน์",
                "การให้กำลังใจและแสดงความยินดีกับนักเดินทางคนอื่น",
              ]} />
            </Section>

            <Section icon="❌" title="2. เนื้อหาที่ไม่อนุญาต">
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["🔞 เนื้อหาสำหรับผู้ใหญ่", "ภาพหรือข้อความลามกอนาจาร เนื้อหากระตุ้นทางเพศ"],
                  ["💢 ความรุนแรงและภัยคุกคาม", "การข่มขู่ คุกคาม หรือแสดงความรุนแรงต่อบุคคลหรือกลุ่ม"],
                  ["😡 การเกลียดชัง", "เนื้อหาที่เลือกปฏิบัติด้านเชื้อชาติ ศาสนา เพศ หรือความพิการ"],
                  ["📛 ข้อมูลเท็จ", "การบิดเบือนข้อมูล รีวิวปลอม หรือการแนะนำสถานที่ที่ไม่มีอยู่จริง"],
                  ["🔗 สแปมและโฆษณา", "การโพสต์ลิงก์โฆษณาซ้ำๆ หรือชักชวนให้ซื้อสินค้าโดยไม่ได้รับอนุญาต"],
                  ["🕵️ การละเมิดความเป็นส่วนตัว", "การเปิดเผยข้อมูลส่วนตัวของผู้อื่นโดยไม่ยินยอม"],
                  ["©️ การละเมิดลิขสิทธิ์", "ใช้รูปภาพ วิดีโอ หรือเนื้อหาของผู้อื่นโดยไม่ได้รับอนุญาต"],
                  ["☠️ เนื้อหาอันตราย", "ส่งเสริมการกระทำผิดกฎหมาย สารเสพติด หรืออาชญากรรม"],
                ].map(([cat, desc]) => (
                  <div key={cat} style={{
                    display: "flex", gap: 14, padding: "12px 16px",
                    background: "#fff5f5", borderRadius: 10,
                    border: "1px solid #fed7d7", alignItems: "flex-start",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13, minWidth: 180, color: "#c53030" }}>{cat}</div>
                    <div style={{ fontSize: 13, color: "#744210" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon="⭐" title="3. มาตรฐานการเขียนรีวิว">
              <p><strong>รีวิวที่ดีควรมีลักษณะดังนี้:</strong></p>
              <BulletList variant="blue" items={[
                "มาจากประสบการณ์จริงของผู้รีวิวเท่านั้น",
                "ให้ข้อมูลที่เฉพาะเจาะจงและเป็นประโยชน์ (เช่น ราคา บรรยากาศ การบริการ)",
                "แสดงความคิดเห็นอย่างตรงไปตรงมาและสุภาพ",
                "ไม่มีความขัดแย้งทางผลประโยชน์ (เช่น เจ้าของสถานที่รีวิวตัวเอง)",
              ]} />
              <p><strong>สิ่งที่ห้ามในรีวิว:</strong></p>
              <BulletList variant="red" items={[
                "ให้คะแนนโดยไม่มีเหตุผล (เช่น 1 ดาวเพราะไม่ชอบหน้า)",
                "รีวิวเพื่อแก้แค้นส่วนตัวที่ไม่เกี่ยวกับคุณภาพจริง",
                "ให้คะแนนสูงโดยแลกกับสิทธิพิเศษโดยไม่เปิดเผย",
                "คัดลอกรีวิวจากแหล่งอื่นมาโพสต์",
              ]} />
            </Section>

            <Section icon="🛡️" title="4. ระบบรายงานและการบังคับใช้">
              <p>
                หากท่านพบเนื้อหาที่ไม่เหมาะสม ท่านสามารถรายงานได้โดยกดปุ่ม 🚩 "รายงาน"
                ในทุกเนื้อหา ทีมแอดมินจะตรวจสอบและดำเนินการภายใน 24–48 ชั่วโมง
              </p>
              <div style={{
                background: "#fffbeb", border: "1px solid #fcd34d",
                borderRadius: 12, padding: "16px 20px", marginTop: 12,
              }}>
                <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
                  📊 กระบวนการพิจารณา
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["1️⃣", "รับรายงานจากผู้ใช้"],
                    ["2️⃣", "แอดมินตรวจสอบและประเมินความรุนแรง"],
                    ["3️⃣", "กำหนดมาตรการ (คำเตือน / ลบเนื้อหา / ระงับบัญชี)"],
                    ["4️⃣", "แจ้งผลการดำเนินการให้ผู้รายงานทราบ"],
                  ].map(([step, text]) => (
                    <div key={step} style={{ display: "flex", gap: 10, fontSize: 14, color: "#78350f" }}>
                      <span>{step}</span><span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section icon="🌱" title="5. การสร้างบรรยากาศที่ดีในชุมชน">
              <BulletList variant="green" items={[
                "ให้เกียรติและเคารพความคิดเห็นที่แตกต่าง",
                "แสดงความคิดเห็นด้วยภาษาที่สุภาพและสร้างสรรค์",
                "ไม่โจมตีตัวบุคคล ติชมได้เฉพาะเนื้อหาหรือบริการ",
                "แชร์ประสบการณ์ที่จะเป็นประโยชน์ต่อนักเดินทางคนอื่น",
                "ยินดีช่วยตอบคำถามและแนะนำสถานที่ให้กับเพื่อนร่วมชุมชน",
              ]} />
            </Section>

            <Section icon="🔄" title="6. กระบวนการอุทธรณ์">
              <p>
                หากท่านเชื่อว่าการตัดสินใจของแอดมินไม่ยุติธรรม ท่านมีสิทธิ์อุทธรณ์ได้:
              </p>
              <BulletList items={[
                "ส่งอีเมลอุทธรณ์มาที่ " + CONTACT_EMAIL + " ภายใน 7 วันหลังได้รับการแจ้งเตือน",
                "ระบุหมายเลขบัญชี เหตุผลที่ไม่เห็นด้วย และหลักฐานประกอบ",
                "ทีมงานจะพิจารณาและตอบกลับภายใน 7 วันทำการ",
                "การตัดสินของทีมงานในระดับอุทธรณ์ถือเป็นที่สิ้นสุด",
              ]} />
            </Section>
          </div>
        )}

        {/* ── Back link ── */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 12,
            background: "#0f172a", color: "#fff",
            textDecoration: "none", fontWeight: 700, fontSize: 14,
          }}>
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>กำลังโหลด...</div>}>
      <PolicyPageInner />
    </Suspense>
  );
}

/* ── Helper Components ── */
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        display: "flex", alignItems: "center", gap: 10,
        fontSize: "1.05rem", fontWeight: 800, color: "var(--pl-text-primary)",
        borderBottom: "2px solid var(--pl-border)", paddingBottom: 10, marginBottom: 16,
      }}>
        <span>{icon}</span> {title}
      </h2>
      <div style={{ color: "var(--pl-text-secondary)", lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "14px 0" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e40af", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function BulletList({ items, variant = "default" }: { items: string[]; variant?: "default"|"green"|"red"|"blue" }) {
  const colors = { default: "#64748b", green: "#166534", red: "#b91c1c", blue: "#1d4ed8" };
  const icons  = { default: "•", green: "✓", red: "✗", blue: "→" };
  return (
    <ul style={{ margin: "8px 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
          <span style={{ color: colors[variant], fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
            {icons[variant]}
          </span>
          <span style={{ color: "var(--pl-text-secondary)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
