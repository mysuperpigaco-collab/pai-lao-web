/**
 * activityLogger.ts
 * ─────────────────────────────────────────────────────────────
 * Helper สำหรับบันทึก UserActivityLog
 * ใช้ตาม พ.ร.บ. คอมพิวเตอร์ มาตรา 26 (เก็บข้อมูลจราจร 90 วัน)
 *
 * Action constants:
 *  Auth:     REGISTER, PASSWORD_RESET_REQUEST, PASSWORD_RESET_SUCCESS
 *  Trip:     CREATE_TRIP, UPDATE_TRIP, DELETE_TRIP
 *  Review:   POST_REVIEW, DELETE_REVIEW
 *  Upload:   UPLOAD_FILE
 *  Report:   SUBMIT_REPORT
 */

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export type ActivityAction =
  // Auth
  | "REGISTER"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  // Trip
  | "CREATE_TRIP"
  | "UPDATE_TRIP"
  | "DELETE_TRIP"
  // Review
  | "POST_REVIEW"
  | "DELETE_REVIEW"
  // Upload
  | "UPLOAD_FILE"
  // Report
  | "SUBMIT_REPORT";

export interface LogActivityOptions {
  userId?:     string | null;
  username?:   string | null;
  action:      ActivityAction;
  ip:          string;
  userAgent?:  string | null;
  targetId?:   string | null;
  targetType?: string | null;
  detail?:     string | null;
}

/** ดึง IP จาก NextRequest — เชื่อ x-real-ip (Vercel เซ็ตเอง สปูฟไม่ได้) ก่อน x-forwarded-for ที่ client ปลอมได้ */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** บันทึก activity — ใช้ .catch(() => {}) เสมอเพื่อไม่ให้ขัดขวาง response */
export async function logActivity(opts: LogActivityOptions): Promise<void> {
  await prisma.userActivityLog.create({
    data: {
      userId:     opts.userId     ?? null,
      username:   opts.username   ?? null,
      action:     opts.action,
      ip:         opts.ip,
      userAgent:  opts.userAgent  ?? null,
      targetId:   opts.targetId   ?? null,
      targetType: opts.targetType ?? null,
      detail:     opts.detail     ?? null,
    },
  });
}
