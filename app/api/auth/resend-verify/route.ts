import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/activityLogger";

const resend  = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://pai-lao.com";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`resend-verify:${ip}`, 3, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "ขอส่งลิงก์ใหม่บ่อยเกินไป กรุณารอ 15 นาที" },
      { status: 429 }
    );
  }

  try {
    const { emailOrUsername } = await req.json();
    if (!emailOrUsername) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลหรือชื่อผู้ใช้" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        emailVerified: false,
      },
      select: { id: true, email: true, firstName: true },
    });

    // Always return ok (ป้องกัน user enumeration)
    if (!user) return NextResponse.json({ ok: true });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExp   = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken, emailVerifyExp: verifyExp },
    });

    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${verifyToken}`;
    const safeName  = user.firstName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    resend.emails.send({
      from: "PAI-LAO <noreply@pai-lao.com>",
      to: user.email,
      subject: "ยืนยันอีเมล — PAI-LAO EXPERIENCE",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#4facfe,#43e97b);display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🌏</div>
            <h1 style="margin:16px 0 4px;font-size:24px;font-weight:900;color:#0f172a;">ยืนยันอีเมลของคุณ</h1>
            <p style="margin:0;color:#64748b;font-size:14px;">PAI-LAO EXPERIENCE</p>
          </div>
          <p style="color:#334155;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${safeName}</strong> 👋</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">กดปุ่มด้านล่างเพื่อยืนยันอีเมลและเริ่มใช้งานได้เลย</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#4facfe,#43e97b);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:15px;">✅ ยืนยันอีเมล</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;">ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong><br/>หากคุณไม่ได้สมัครสมาชิก สามารถเพิกเฉยต่ออีเมลนี้ได้เลย</p>
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;"/>
          <p style="color:#cbd5e1;font-size:12px;text-align:center;">© 2026 PAI-LAO EXPERIENCE · <a href="${BASE_URL}" style="color:#94a3b8;">pai-lao.com</a></p>
        </div>
      `,
    }).catch((err: unknown) => console.error("resend-verify email failed:", err));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("resend-verify error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
