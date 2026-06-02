import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/verify-email?token=xxx
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/login?verified=invalid", req.url));
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExp: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?verified=invalid", req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified:     true,
        emailVerifyToken:  null,
        emailVerifyExp:    null,
      },
    });

    return NextResponse.redirect(new URL("/login?verified=success", req.url));
  } catch (error) {
    console.error("GET /api/auth/verify-email:", error);
    return NextResponse.redirect(new URL("/login?verified=error", req.url));
  }
}
