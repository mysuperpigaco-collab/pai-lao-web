import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { logActivity, getClientIp } from "@/lib/activityLogger";
import { checkRateLimit } from "@/lib/rateLimit";

// bucket ใน Supabase Storage (ต้องสร้างไว้ก่อน)
const BUCKET = "pai-lao-media";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    // ── Rate limit: 30 uploads / นาที ต่อ user ──────────────
    const rl = checkRateLimit(`upload:${session.userId}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ message: "อัปโหลดบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) return NextResponse.json({ message: "ไม่พบไฟล์" }, { status: 400 });

    // ตรวจประเภทไฟล์
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "อนุญาตเฉพาะไฟล์รูปภาพ" }, { status: 400 });
    }

    // จำกัดขนาด 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "ไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });
    }

    // Sanitize extension — อนุญาตเฉพาะ image extensions ที่รู้จัก
    const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : "jpg";
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, ""); // ป้องกัน path traversal
    const filename = `${safeFolder}/${session.userId}/${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType:  file.type,
        cacheControl: "3600",
        upsert:       false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ message: "อัปโหลดไม่สำเร็จ: " + error.message }, { status: 500 });
    }

    // สร้าง public URL
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);

    await logActivity({
      userId: session.userId, username: session.username,
      action: "UPLOAD_FILE",
      ip: getClientIp(request), userAgent: request.headers.get("user-agent"),
      targetType: "FILE",
      detail: `${filename} (${(file.size / 1024).toFixed(1)} KB)`,
    }).catch(() => {});

    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
