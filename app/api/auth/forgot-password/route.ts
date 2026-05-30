import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://pai-lao-web.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success (security: don't reveal if email exists)
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExp: exp },
    });

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "PAI-LAO <onboarding@resend.dev>",
      to: user.email,
      subject: "รีเซ็ตรหัสผ่าน — PAI-LAO EXPERIENCE",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#2563eb,#10b981);display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🌏</div>
            <h1 style="margin:16px 0 4px;font-size:24px;font-weight:900;color:#0f172a;">รีเซ็ตรหัสผ่าน</h1>
            <p style="margin:0;color:#64748b;font-size:14px;">PAI-LAO EXPERIENCE</p>
          </div>
          <p style="color:#334155;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${user.firstName}</strong>,</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#10b981);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:15px;">ตั้งรหัสผ่านใหม่</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;">ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong><br/>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถเพิกเฉยต่ออีเมลนี้ได้เลย</p>
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;"/>
          <p style="color:#cbd5e1;font-size:12px;text-align:center;">© 2026 PAI-LAO EXPERIENCE · <a href="${BASE_URL}" style="color:#94a3b8;">pai-lao-web.vercel.app</a></p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
