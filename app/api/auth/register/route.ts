import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Common
      firstName, lastName, username, email, phone, password,
      // Traveler optional
      displayName, birthDate, gender,
      // Account type
      role = "TRAVELER",
      // Business (ถ้า role = BUSINESS)
      businessName,
    } = body;

    // ── Validation ────────────────────────────────────────────
    if (!firstName || !lastName || !username || !email || !phone || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (role === "BUSINESS" && !businessName) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อธุรกิจ" },
        { status: 400 }
      );
    }

    // ── ตรวจซ้ำ ──────────────────────────────────────────────
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานไปแล้ว" },
        { status: 409 }
      );
    }
    if (existingUsername) {
      return NextResponse.json(
        { message: "ชื่อผู้ใช้งานนี้ถูกใช้งานไปแล้ว" },
        { status: 409 }
      );
    }

    // ── Hash password ─────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── สร้าง User + Business (ถ้ามี) ใน transaction ─────────
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        phone,
        password: hashedPassword,
        displayName: displayName || `${firstName} ${lastName}`,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender: gender ? gender.toUpperCase() as any : undefined,
        role: role === "BUSINESS" ? "BUSINESS" : "TRAVELER",
        // สร้าง Business record พร้อมกันถ้าสมัครเป็นเจ้าของธุรกิจ
        business: role === "BUSINESS" ? {
          create: {
            businessName,
            contactName: `${firstName} ${lastName}`,
            email,
            phone,
          },
        } : undefined,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    // ── ออก JWT แล้ว set cookie ───────────────────────────────
    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ!", userId: user.id, role: user.role },
      { status: 201 }
    );

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
