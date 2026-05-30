import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ username: string }> };

const BUCKET = "pai-lao-media";
const MAX_COVERS = 5;

// POST /api/users/[username]/covers — อัปโหลดรูปปก (เจ้าของเท่านั้น)
export async function POST(req: Request, { params }: Params) {
  try {
    const { username } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true, profileCovers: true } });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.id !== session.userId) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    if (user.profileCovers.length >= MAX_COVERS) {
      return NextResponse.json({ message: `อนุญาตสูงสุด ${MAX_COVERS} รูป` }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ message: "ไม่พบไฟล์" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ message: "อนุญาตเฉพาะไฟล์รูปภาพ" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "ไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `profile-covers/${session.userId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, cacheControl: "3600", upsert: false });

    if (error) return NextResponse.json({ message: "อัปโหลดไม่สำเร็จ: " + error.message }, { status: 500 });

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
    const newUrl = data.publicUrl;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileCovers: [...user.profileCovers, newUrl] },
      select: { profileCovers: true },
    });

    return NextResponse.json({ url: newUrl, profileCovers: updated.profileCovers }, { status: 201 });
  } catch (err) {
    console.error("POST covers:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/users/[username]/covers — ลบรูปปกที่ระบุ (เจ้าของเท่านั้น)
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { username } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { username }, select: { id: true, profileCovers: true } });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.id !== session.userId) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    const { url } = await req.json() as { url: string };
    if (!url) return NextResponse.json({ message: "ระบุ URL ที่ต้องการลบ" }, { status: 400 });

    // ลบออกจาก Supabase Storage (best-effort)
    try {
      const pathMatch = url.match(/profile-covers\/.+/);
      if (pathMatch) await supabaseAdmin.storage.from(BUCKET).remove([pathMatch[0]]);
    } catch {}

    const newCovers = user.profileCovers.filter(c => c !== url);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profileCovers: newCovers },
      select: { profileCovers: true },
    });

    return NextResponse.json({ profileCovers: updated.profileCovers });
  } catch (err) {
    console.error("DELETE covers:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
