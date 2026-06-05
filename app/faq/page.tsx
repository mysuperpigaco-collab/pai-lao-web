"use client";

import { useState } from "react";
import Link from "next/link";

type FAQ = { q: string; a: string };
type Section = { id: string; icon: string; label: string; items: FAQ[] };

const SECTIONS: Section[] = [
  {
    id: "general",
    icon: "🌐",
    label: "ทั่วไป",
    items: [
      {
        q: "ไปเล่าคืออะไร?",
        a: "ไปเล่า (PAI-LAO EXPERIENCE) คือแพลตฟอร์มชุมชนนักท่องเที่ยวไทย ที่รวบรวมรีวิวทริป สถานที่ท่องเที่ยว และแรงบันดาลใจการเดินทางไว้ในที่เดียว เหมาะสำหรับทั้งนักท่องเที่ยวที่ต้องการหาไอเดียเที่ยว และเจ้าของธุรกิจที่ต้องการโปรโมตสถานที่ของตนเอง",
      },
      {
        q: "ใช้งานฟรีไหม?",
        a: "ฟรีทั้งหมดสำหรับนักท่องเที่ยว ทั้งการดูสถานที่ อ่านรีวิว บันทึกทริป และวางแผนการเดินทาง สำหรับเจ้าของธุรกิจ การลงทะเบียนและจัดการสถานที่ก็ฟรีเช่นกัน",
      },
      {
        q: "สมัครสมาชิกยังไง?",
        a: "กดปุ่ม \"สมัครสมาชิก\" ที่แถบเมนูด้านบน กรอกอีเมลและรหัสผ่าน จากนั้นยืนยันอีเมลของคุณผ่านลิงก์ที่ส่งให้ ก็พร้อมใช้งานทันที",
      },
      {
        q: "ลืมรหัสผ่านทำยังไง?",
        a: "ไปที่หน้าล็อกอิน แล้วกด \"ลืมรหัสผ่าน\" กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้ทางอีเมล ลิงก์มีอายุ 1 ชั่วโมง",
      },
      {
        q: "แก้ไขข้อมูลโปรไฟล์ได้ที่ไหน?",
        a: "ล็อกอินแล้วกดที่ชื่อผู้ใช้มุมขวาบน เลือก \"โปรไฟล์\" หรือไปที่หน้า /dashboard/edit-profile เพื่อแก้ไขชื่อ รูปโปรไฟล์ และข้อมูลส่วนตัว",
      },
    ],
  },
  {
    id: "traveler",
    icon: "🧭",
    label: "นักท่องเที่ยว",
    items: [
      {
        q: "รีวิวทริปคืออะไร และต่างจากสถานที่ยังไง?",
        a: "ทริป คือเรื่องเล่าการเดินทางที่คุณสร้างขึ้น รวมรูปภาพ เส้นทาง และประสบการณ์ส่วนตัว ส่วน สถานที่ คือฐานข้อมูลของจุดหมายปลายทาง เช่น คาเฟ่ น้ำตก วัด ที่ผู้ใช้ทุกคนช่วยกันรีวิวได้",
      },
      {
        q: "เขียนรีวิวทริปยังไง?",
        a: "กดปุ่ม \"+ เพิ่มสถานที่\" หรือไปที่ /trips/create กรอกชื่อทริป รูปปก คำอธิบาย และเพิ่มจุดแวะในเส้นทาง เมื่อพร้อมกด \"เผยแพร่\" ทริปจะถูกส่งให้แอดมินตรวจสอบก่อนขึ้นแสดง",
      },
      {
        q: "ทำไมทริปที่เขียนยังไม่ขึ้นในเว็บ?",
        a: "ทริปทุกชิ้นต้องผ่านการตรวจสอบจากทีมงานก่อน โดยปกติใช้เวลา 1–2 วันทำการ หากผ่านแล้วจะแสดงบนเว็บอัตโนมัติ หากไม่ผ่านจะมีแจ้งเหตุผลในหน้าโปรไฟล์",
      },
      {
        q: "บันทึกสถานที่โปรดทำยังไง?",
        a: "กดไอคอน 🔖 บนการ์ดสถานที่หรือหน้ารายละเอียดสถานที่ สถานที่จะถูกบันทึกไว้ใน Bookmark ของคุณ สามารถดูได้ที่เมนู \"บุ๊กมาร์ก\" ในโปรไฟล์",
      },
      {
        q: "แพลนเนอร์ทริปใช้งานยังไง?",
        a: "ไปที่เมนู \"วางแผน\" หรือ /planner เพื่อสร้างแผนการเดินทางส่วนตัว เพิ่มสถานที่ กำหนดวัน-เวลา และแชร์แผนให้เพื่อนได้ทำลิงก์สาธารณะ",
      },
      {
        q: "ภารกิจ (Missions) คืออะไร?",
        a: "ภารกิจคือกิจกรรมพิเศษที่ระบบหรือเจ้าของสถานที่ตั้งขึ้น เช่น ไปถ่ายรูปที่จุดนี้ หรือรีวิวสถานที่นี้ เมื่อทำสำเร็จจะได้รับแต้มหรือ Badge สะสม",
      },
      {
        q: "รีวิวสถานที่ทำยังไง?",
        a: "เข้าไปที่หน้าสถานที่ที่ต้องการ แล้วเลื่อนลงมาที่ส่วน \"รีวิว\" กดให้คะแนนดาวและเขียนความคิดเห็น กด \"ส่งรีวิว\" ได้เลย รีวิวจะขึ้นทันที",
      },
      {
        q: "โปรโมชั่นของร้านดูได้ที่ไหน?",
        a: "ดูได้ที่เมนู \"โปรโมชั่น\" หรือ /promotions โปรโมชั่นจะแสดงเฉพาะที่ยังอยู่ในช่วงระยะเวลาที่กำหนด กดเข้าไปดูรายละเอียดเงื่อนไขของแต่ละโปรโมชั่นได้",
      },
    ],
  },
  {
    id: "business",
    icon: "🏢",
    label: "เจ้าของธุรกิจ",
    items: [
      {
        q: "จะสมัครเป็นเจ้าของธุรกิจได้ยังไง?",
        a: "สมัครสมาชิกปกติก่อน แล้วติดต่อทีมงานเพื่อขอเปิดสิทธิ์บัญชีธุรกิจ หรือสอบถามผ่านช่องทางติดต่อด้านล่าง ทีมงานจะปรับสถานะให้ภายใน 1–2 วันทำการ",
      },
      {
        q: "เพิ่มสถานที่ใหม่ทำยังไง?",
        a: "ล็อกอินด้วยบัญชีธุรกิจ ไปที่ Business Dashboard แล้วกด \"+ เพิ่มสถานที่ใหม่\" กรอกข้อมูลให้ครบ ได้แก่ ชื่อ หมวดหมู่ จังหวัด อำเภอ รูปปก และคำอธิบาย เมื่อส่งแล้วรอแอดมินอนุมัติ 1–2 วันทำการ",
      },
      {
        q: "Claim สถานที่ที่มีอยู่แล้วในระบบทำยังไง?",
        a: "ใน Business Dashboard เลื่อนลงมาที่ส่วน \"ค้นหาและยืนยันความเป็นเจ้าของสถานที่\" พิมพ์ชื่อสถานที่ แล้วกดปุ่ม \"เป็นเจ้าของ\" ระบบจะส่งคำขอให้แอดมินตรวจสอบก่อน โดยปกติใช้เวลา 1–2 วันทำการ",
      },
      {
        q: "ทำไมยกเลิกความเป็นเจ้าของสถานที่ที่ Claim มาแล้วลบไม่ได้?",
        a: "สถานที่ที่ Claim มาจากฐานข้อมูลชุมชน (ที่ผู้ใช้อื่นเพิ่มไว้) เมื่อยกเลิกความเป็นเจ้าของ สถานที่จะกลับสู่ระบบให้ผู้อื่น Claim ต่อได้ ส่วนสถานที่ที่คุณสร้างเองสามารถลบออกจากระบบได้",
      },
      {
        q: "แก้ไขข้อมูลสถานที่ทำยังไง?",
        a: "ใน Business Dashboard กดปุ่ม \"แก้ไข\" บนการ์ดสถานที่ที่ต้องการ แก้ไขข้อมูลแล้วกด \"บันทึก\" การแก้ไขจะถูกส่งให้แอดมินตรวจสอบก่อนมีผล (1–2 วันทำการ) สถานที่เดิมยังแสดงอยู่ระหว่างรอ",
      },
      {
        q: "ส่งโปรโมชั่นทำยังไง?",
        a: "ใน Business Dashboard กดปุ่ม \"+ เพิ่มโปรโมชั่น\" กรอกชื่อโปรโมชั่น รายละเอียด ส่วนลด และช่วงเวลา กด \"ส่งคำขอโปรโมชั่น\" เมื่อแอดมินอนุมัติโปรโมชั่นจะแสดงในหน้า Deals และหน้าสถานที่ทันที",
      },
      {
        q: "ตอบกลับรีวิวลูกค้าได้ไหม?",
        a: "ได้ครับ ใน Business Dashboard ส่วนแจ้งเตือนจะแสดงรีวิวใหม่ กดปุ่ม \"ตอบกลับ\" เพื่อตอบกลับรีวิวนั้นได้โดยตรง หรือเข้าไปที่หน้าสถานที่แล้วตอบในส่วนรีวิว",
      },
      {
        q: "สถานที่ถูกปฏิเสธ ทำยังไงต่อ?",
        a: "แอดมินจะระบุเหตุผลที่ปฏิเสธ ซึ่งจะแสดงบนการ์ดสถานที่ใน Dashboard คุณสามารถแก้ไขข้อมูลตามที่แนะนำแล้วส่งใหม่ได้ทันที ไม่มีข้อจำกัดจำนวนครั้ง",
      },
      {
        q: "การแก้ไขสถานที่ถูกปฏิเสธ ต้องทำยังไง?",
        a: "จะมีแจ้งเตือนใน Dashboard พร้อมเหตุผล กดปุ่ม \"แก้ไขใหม่\" จากการแจ้งเตือน หรือกดปุ่มแก้ไขบนการ์ดสถานที่ แก้ไขข้อมูลแล้วส่งใหม่ได้เลย ไม่ต้องสร้างใหม่ทั้งหมด",
      },
    ],
  },
  {
    id: "content",
    icon: "📋",
    label: "เนื้อหาและกฎการใช้งาน",
    items: [
      {
        q: "เนื้อหาแบบไหนที่ไม่ได้รับอนุมัติ?",
        a: "เนื้อหาที่มีข้อมูลเท็จ ไม่เกี่ยวข้องกับการท่องเที่ยว มีเนื้อหาโฆษณาชวนเชื่อ หมิ่นประมาท หรือละเมิดสิทธิ์บุคคลอื่น รวมถึงรูปภาพที่ไม่เหมาะสมและลิขสิทธิ์ของผู้อื่น",
      },
      {
        q: "รายงานเนื้อหาที่ไม่เหมาะสมทำยังไง?",
        a: "กดปุ่ม \"รายงาน\" (⚑) ที่มุมของทริปหรือรีวิวนั้น เลือกเหตุผล แล้วกดส่ง ทีมงานจะตรวจสอบภายใน 24–48 ชั่วโมง",
      },
      {
        q: "รูปภาพที่ใช้ในเว็บมีลิขสิทธิ์ไหม?",
        a: "รูปภาพทุกใบที่อัปโหลดโดยผู้ใช้ ผู้อัปโหลดเป็นผู้รับผิดชอบสิทธิ์ในภาพนั้น ไปเล่าขอสงวนสิทธิ์ใช้ภาพเพื่อแสดงผลบนแพลตฟอร์มเท่านั้น",
      },
    ],
  },
];

function FAQItem({ q, a, defaultOpen = false }: FAQ & { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderBottom: "1px solid #f1f5f9",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "18px 24px", background: "transparent", border: "none",
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", lineHeight: 1.5 }}>{q}</span>
        <span style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
          background: open ? "#10b981" : "#f1f5f9",
          color: open ? "white" : "#64748b",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, transition: "all 0.2s",
          transform: open ? "rotate(45deg)" : "none",
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 24px 20px", fontSize: 14, color: "#475569", lineHeight: 1.8 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState("general");

  const current = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 80px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: "0 0 12px" }}>คำถามที่พบบ่อย</h1>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Frequently Asked Questions · หากไม่พบคำตอบ ติดต่อเราได้เสมอ</p>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: "10px 22px", borderRadius: 999, border: "1.5px solid",
              borderColor: activeSection === s.id ? "#10b981" : "#e2e8f0",
              background: activeSection === s.id ? "#10b981" : "white",
              color: activeSection === s.id ? "white" : "#475569",
              fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 24px rgba(15,23,42,0.06)" }}>
        {/* Section header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{current.icon}</span>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#0f172a" }}>{current.label}</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{current.items.length} คำถาม</span>
        </div>

        {current.items.map((item, i) => (
          <FAQItem key={i} {...item} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Contact CTA */}
      <div style={{ marginTop: 40, background: "linear-gradient(135deg,#0f172a,#1e3a8a)", borderRadius: 20, padding: "36px 32px", textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>ยังไม่พบคำตอบ?</h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>ทีมงานไปเล่าพร้อมช่วยเหลือคุณ</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:support@pai-lao.app"
            style={{ padding: "11px 24px", background: "#10b981", color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            📧 ส่งอีเมลหาเรา
          </a>
          <Link href="/"
            style={{ padding: "11px 24px", background: "rgba(255,255,255,0.12)", color: "white", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)" }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
