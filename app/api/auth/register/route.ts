import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLogger";
import { checkRateLimit } from "@/lib/rateLimit";
import { Resend } from "resend";
import crypto from "crypto";
import { hashToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const resend  = new Resend(process.env.RESEND_API_KEY);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://pai-lao.com";
  const ip        = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? null;

  // ── Rate limit: 5 ครั้ง / 10 นาที ต่อ IP ───────────────────
  const rl = await checkRateLimit(`register:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { message: `สมัครสมาชิกบ่อยเกินไป กรุณารอ ${Math.ceil(retryAfter / 60)} นาที` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const {
      firstName, lastName, username, email, phone, password,
      displayName, birthDate, gender,
      lineId, facebook, instagram, tiktok,
      role = "TRAVELER",
      businessName,
    } = body;

    // ── Validation ────────────────────────────────────────────
    if (!firstName || !lastName || !username || !email || !phone || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือ _ (3-30 ตัว)" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข" },
        { status: 400 }
      );
    }

    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ message: "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก" }, { status: 400 });
    }

    if (role === "BUSINESS" && !businessName) {
      return NextResponse.json({ message: "กรุณากรอกชื่อธุรกิจ" }, { status: 400 });
    }

    // ── ตรวจซ้ำ ──────────────────────────────────────────────
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานไปแล้ว" }, { status: 409 });
    }
    if (existingUsername) {
      return NextResponse.json({ message: "ชื่อผู้ใช้งานนี้ถูกใช้งานไปแล้ว" }, { status: 409 });
    }

    // ── Hash password ─────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── สร้าง User ────────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        firstName, lastName, username, email, phone,
        password: hashedPassword,
        displayName: displayName || `${firstName} ${lastName}`,
        birthDate:  birthDate ? new Date(birthDate) : undefined,
        gender:     gender ? gender.toUpperCase() as any : undefined,
        lineId:     lineId    || undefined,
        facebook:   facebook  || undefined,
        instagram:  instagram || undefined,
        tiktok:     tiktok    || undefined,
        role: role === "BUSINESS" ? "BUSINESS" : "TRAVELER",
        business: role === "BUSINESS" ? {
          create: {
            businessName,
            contactName: `${firstName} ${lastName}`,
            email, phone,
            lineId:    lineId    || undefined,
            facebook:  facebook  || undefined,
            instagram: instagram || undefined,
            tiktok:    tiktok    || undefined,
          },
        } : undefined,
      },
      select: { id: true, username: true, role: true },
    });

    // ── สร้าง email verify token ──────────────────────────────
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExp   = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 ชั่วโมง

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: hashToken(verifyToken), emailVerifyExp: verifyExp },
    });

    // ── ส่งอีเมลยืนยัน (ไม่บล็อก response ถ้า fail) ─────────
    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${verifyToken}`;
    const safeFirstName = firstName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const emailResult = await resend.emails.send({
      from: "PAI-LAO <noreply@pai-lao.com>",
      to: email,
      subject: "ยืนยันอีเมล — PAI-LAO EXPERIENCE",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#4facfe,#43e97b);display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🌏</div>
            <h1 style="margin:16px 0 4px;font-size:24px;font-weight:900;color:#0f172a;">ยืนยันอีเมลของคุณ</h1>
            <p style="margin:0;color:#64748b;font-size:14px;">PAI-LAO EXPERIENCE</p>
          </div>
          <p style="color:#334155;font-size:15px;line-height:1.7;">สวัสดีคุณ <strong>${safeFirstName}</strong> 👋</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;">ขอบคุณที่สมัครสมาชิกกับ PAI-LAO กดปุ่มด้านล่างเพื่อยืนยันอีเมลและเริ่มใช้งานได้เลย</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#4facfe,#43e97b);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:15px;">✅ ยืนยันอีเมล</a>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;">ลิงก์นี้จะหมดอายุใน <strong>24 ชั่วโมง</strong><br/>หากคุณไม่ได้สมัครสมาชิก สามารถเพิกเฉยต่ออีเมลนี้ได้เลย</p>
          <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;"/>
          <p style="color:#cbd5e1;font-size:12px;text-align:center;">© 2026 PAI-LAO EXPERIENCE · <a href="${BASE_URL}" style="color:#94a3b8;">${BASE_URL.replace("https://","")}</a></p>
        </div>
      `,
    });
    if (emailResult.error) {
      console.error("ส่ง verify email ไม่สำเร็จ:", JSON.stringify(emailResult.error));
    }

    // ── บันทึก log การสมัคร ───────────────────────────────────
    await logActivity({
      userId: user.id, username: user.username,
      action: "REGISTER",
      ip, userAgent,
      detail: `role: ${user.role}`,
    }).catch(() => {});

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}
