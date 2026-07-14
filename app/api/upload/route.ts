import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
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
    const rl = await checkRateLimit(`upload:${session.userId}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ message: "อัปโหลดบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) return NextResponse.json({ message: "ไม่พบไฟล์" }, { status: 400 });

    // ตรวจประเภทไฟล์ — whitelist เฉพาะ raster (ตัด svg เพราะฝัง script ได้)
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ message: "อนุญาตเฉพาะ JPG, PNG, WEBP, GIF, AVIF" }, { status: 400 });
    }

    // ตรวจ magic bytes กันการปลอม MIME
    const head = Buffer.from(await file.slice(0, 12).arrayBuffer());
    const isJpeg = head[0] === 0xff && head[1] === 0xd8;
    const isPng  = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const isGif  = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
    const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    const isAvif = head.toString("latin1", 4, 8) === "ftyp";
    if (!(isJpeg || isPng || isGif || isWebp || isAvif)) {
      return NextResponse.json({ message: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" }, { status: 400 });
    }

    // จำกัดขนาด 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "ไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });
    }

    // Sanitize extension — อนุญาตเฉพาะ image extensions ที่รู้จัก
    const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    let ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : "jpg";
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, ""); // ป้องกัน path traversal
    let buffer      = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;

    // ── บีบอัด + strip EXIF/GPS ด้วย sharp (GIF ข้าม — รักษาอนิเมชัน) ──
    // .rotate() = หมุนตาม EXIF orientation ก่อน strip (ไม่งั้นรูปมือถือนอนตะแคง)
    // resize inside 1920 = จอผู้ใช้แสดงได้แค่นี้ ความคมชัดที่เห็นไม่ต่างเดิม
    // webp q82 = จุด visually-lossless มาตรฐาน · fail-open: sharp พังใช้ไฟล์เดิม
    let thumbBuffer: Buffer | null = null;
    if (file.type !== "image/gif") {
      try {
        buffer = await sharp(buffer)
          .rotate()
          .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        contentType = "image/webp";
        ext = "webp";
        // thumbnail สำหรับการ์ด (640px = 2x ของการ์ด ~320px, จอ retina ไม่แตก)
        try {
          thumbBuffer = await sharp(buffer)
            .resize({ width: 640, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toBuffer();
        } catch { thumbBuffer = null; }
      } catch (e) {
        console.error("[upload] sharp failed — fallback to original file:", e);
      }
    }

    // ── ชื่อไฟล์: ถ้ามี thumb สำเร็จ ใส่ marker "t" (<ts>t.webp) — lib/imageUrl.ts
    //    ใช้ marker นี้ตัดสินว่าไฟล์ไหนมี <ts>t_thumb.webp คู่กัน (ไฟล์เก่าไม่มี marker
    //    = ไม่ถูกแตะเลย ไม่มีการยิงหา thumb ที่ไม่มีจริง) ──
    const ts = Date.now();

    // อัปโหลด thumb ก่อน — ถ้าพัง ตัด marker ทิ้ง (ไฟล์หลักจะไม่ชี้หา thumb ที่ไม่มี)
    let hasThumb = false;
    if (thumbBuffer) {
      const { error: thumbErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(`${safeFolder}/${session.userId}/${ts}t_thumb.webp`, thumbBuffer, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert:       false,
        });
      if (thumbErr) console.error("[upload] thumb upload failed (non-fatal):", thumbErr);
      else hasThumb = true;
    }

    const filename = `${safeFolder}/${session.userId}/${ts}${hasThumb ? "t" : ""}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
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
      detail: `${filename} (${(file.size / 1024).toFixed(1)} KB → ${(buffer.length / 1024).toFixed(1)} KB)`,
    }).catch(() => {});

    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
