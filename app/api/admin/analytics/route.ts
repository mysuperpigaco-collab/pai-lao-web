import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RawRow = { date: string; count: bigint };

const toSeries = (rows: RawRow[]) =>
  rows.map(r => ({ date: r.date, count: Number(r.count) }));

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [signups, logins, trips, places, reviews] = await Promise.all([
      prisma.$queryRaw<RawRow[]>`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
               COUNT(*)::bigint AS count
        FROM "User"
        WHERE "createdAt" >= ${since}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw<RawRow[]>`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
               COUNT(*)::bigint AS count
        FROM "LoginLog"
        WHERE action = 'LOGIN_SUCCESS' AND "createdAt" >= ${since}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw<RawRow[]>`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
               COUNT(*)::bigint AS count
        FROM "Trip"
        WHERE "createdAt" >= ${since}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw<RawRow[]>`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
               COUNT(*)::bigint AS count
        FROM "Place"
        WHERE "createdAt" >= ${since}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw<RawRow[]>`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
               COUNT(*)::bigint AS count
        FROM "Review"
        WHERE "createdAt" >= ${since}
        GROUP BY date ORDER BY date
      `,
    ]);

    return NextResponse.json({
      signups: toSeries(signups),
      logins:  toSeries(logins),
      trips:   toSeries(trips),
      places:  toSeries(places),
      reviews: toSeries(reviews),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("Admin analytics error:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด: " + msg }, { status: 500 });
  }
}
