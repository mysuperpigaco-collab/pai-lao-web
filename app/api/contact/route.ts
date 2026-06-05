import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_EMAIL = "supportpailao@gmail.com";
const RATE_LIMIT_MINUTES = 10; // 1 email ต่อ 10 นาทีต่อ email address

export async function POST(req: Request) {
  try {
    const { name, email, subject, message, category } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "ข้อความต้องมีอย่างน้อย 10 ตัวอักษร" }, { status: 400 });
    }

    // Rate limit — เช็คว่า email นี้ส่งมาใน 10 นาทีล่าสุดหรือไม่
    const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
    const recentLog = await prisma.adminLog.findFirst({
      where: {
        action: "CONTACT_FORM",
        detail: { contains: email.toLowerCase() },
        createdAt: { gte: since },
      },
    });
    if (recentLog) {
      return NextResponse.json({ error: `กรุณารอ ${RATE_LIMIT_MINUTES} นาทีก่อนส่งอีกครั้ง` }, { status: 429 });
    }

    const categoryLabel: Record<string, string> = {
      general: "ทั่วไป",
      business: "เจ้าของธุรกิจ",
      bug: "แจ้งปัญหา",
      content: "เนื้อหาไม่เหมาะสม",
      ads: "ติดต่อโฆษณา",
      partnership: "ความร่วมมือ",
      other: "อื่นๆ",
    };

    const now = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "full", timeStyle: "short",
    });

    await resend.emails.send({
      from: "PAI-LAO Contact <onboarding@resend.dev>",
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[ติดต่อไปเล่า] ${subject?.trim() || "ไม่ระบุหัวข้อ"} — ${categoryLabel[category] ?? "ทั่วไป"}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 32px;color:white;">
            <div style="font-size:22px;font-weight:900;letter-spacing:2px;">🗺️ ไปเล่า</div>
            <div style="font-size:13px;opacity:0.7;margin-top:4px;">PAI-LAO EXPERIENCE · ข้อความจากผู้ใช้</div>
          </div>
          <div style="padding:28px 32px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
              <tr><td style="padding:8px 0;color:#64748b;width:120px;">ชื่อผู้ส่ง</td><td style="padding:8px 0;font-weight:700;color:#0f172a;">${name.trim()}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">อีเมล</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2563eb;">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">หมวดหมู่</td><td style="padding:8px 0;color:#0f172a;">${categoryLabel[category] ?? "ทั่วไป"}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">หัวข้อ</td><td style="padding:8px 0;font-weight:700;color:#0f172a;">${subject?.trim() || "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;">วันที่</td><td style="padding:8px 0;color:#0f172a;">${now}</td></tr>
            </table>
            <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
              <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">ข้อความ</div>
              <div style="font-size:15px;color:#1e293b;line-height:1.8;white-space:pre-wrap;">${message.trim()}</div>
            </div>
            <div style="margin-top:20px;padding:12px 16px;background:#eff6ff;border-radius:8px;font-size:12px;color:#2563eb;">
              💡 กด Reply เพื่อตอบกลับหาผู้ส่งโดยตรง
            </div>
          </div>
          <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
            ส่งจากหน้าติดต่อ pai-lao-web.vercel.app/contact
          </div>
        </div>
      `,
    });

    // บันทึก log สำหรับ rate limiting
    await prisma.adminLog.create({
      data: {
        adminId:    "00000000-0000-0000-0000-000000000000", // placeholder สำหรับ contact form
        action:     "CONTACT_FORM",
        targetType: "CONTACT",
        targetId:   "contact",
        detail:     `from:${email.toLowerCase()} name:${name.trim()} cat:${category}`,
      },
    }).catch(() => {}); // ไม่ block ถ้า log ไม่สำเร็จ

    return NextResponse.json({ ok: true, message: "ส่งข้อความสำเร็จ" });
  } catch (err) {
    console.error("POST /api/contact:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
