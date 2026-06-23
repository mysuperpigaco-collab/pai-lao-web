/**
 * ล้าง "รีวิวรั่ว" — รีวิวสถานที่ที่ถูกสร้างเป็น row จริงตั้งแต่ตอน submit ทริป (โค้ดเก่า)
 * โดยไม่เช็คว่าทริป/สถานที่อนุมัติแล้วหรือยัง ทำให้:
 *   1) โผล่หน้าสถานที่ (place page ดึงรีวิวด้วย placeId ไม่กรองอนุมัติ)
 *   2) โผล่ในคอมเมนต์ทริป (TripComments ดึงด้วย tripId) — รีวิวสถานที่ไม่ควรมี tripId
 *
 * ลายเซ็นตัวรั่ว = Review ที่มี placeId != null (รีวิวสถานที่) แต่ origin มาจาก timeline stop
 * ของทริปที่ "ยังไม่อนุมัติ+เผยแพร่" หรือมี tripId ติดมา (ผิดกฎ placeId XOR tripId)
 *
 * กฎจัดการ (ตรงกับ lib/sharedReviews.ts ปัจจุบัน):
 *   - ทริปอนุมัติ+เผยแพร่ & สถานที่อนุมัติ  → ของจริง คงไว้หน้าสถานที่ แต่ "ตัด tripId ทิ้ง" (กันโผล่คอมเมนต์ทริป)
 *   - นอกนั้น (ทริปไม่อนุมัติ/draft/reject หรือสถานที่ไม่อนุมัติ) → รั่ว → ลบทิ้ง
 *
 * ปลอดภัย: dry-run เป็นค่าเริ่มต้น ต้องใส่ --execute ถึงจะแก้จริง
 *
 * Usage:
 *   npx tsx scripts/cleanup-leaked-reviews.ts                 # dry-run ทุกสถานที่
 *   npx tsx scripts/cleanup-leaked-reviews.ts --place=asok    # dry-run เฉพาะสถานที่ (match slug/ชื่อ)
 *   npx tsx scripts/cleanup-leaked-reviews.ts --place=asok --execute   # แก้จริงเฉพาะสถานที่นั้น
 *   npx tsx scripts/cleanup-leaked-reviews.ts --execute       # แก้จริงทุกสถานที่
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXECUTE = process.argv.includes("--execute");
const placeArg = process.argv
  .find(a => a.startsWith("--place="))
  ?.slice("--place=".length)
  ?.toLowerCase()
  ?.trim();
// ลบรีวิวตาม id ตรง ๆ (เช่น รีวิวเทสต์ที่พิมพ์เองหน้าสถานที่) — คั่นด้วยจุลภาค
const idsArg = process.argv
  .find(a => a.startsWith("--ids="))
  ?.slice("--ids=".length)
  .split(",")
  .map(s => s.trim())
  .filter(Boolean) ?? [];

const snip = (s: string | null | undefined, n = 60) =>
  (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// ทริปนับว่า "เผยแพร่ได้" (รีวิว/รูปควรโชว์หน้าสถานที่) เมื่ออนุมัติ+เผยแพร่+ไม่ใช่ draft
const tripIsLive = (t: { approvalStatus: string | null; isPublished: boolean; isDraft: boolean } | null) =>
  !!t && t.approvalStatus === "APPROVED" && t.isPublished && !t.isDraft;

async function main() {
  console.log(`\n=== cleanup-leaked-reviews — ${EXECUTE ? "EXECUTE (แก้จริง)" : "DRY-RUN (ดูอย่างเดียว)"} ===`);
  if (placeArg) console.log(`กรองเฉพาะสถานที่ที่ slug/ชื่อ มีคำว่า: "${placeArg}"`);

  // ── โหมดลบตาม id ตรง ๆ (จบในตัว ไม่ยุ่งกับ logic วินิจฉัย) ──
  if (idsArg.length) {
    const targets = await prisma.review.findMany({
      where: { id: { in: idsArg } },
      select: { id: true, text: true, place: { select: { title: true } }, author: { select: { username: true } } },
    });
    console.log(`\n--- ลบตาม id ที่ระบุ (${targets.length}/${idsArg.length} เจอใน DB) ---`);
    for (const t of targets) console.log(`  • [${t.place?.title ?? "?"}] @${t.author?.username ?? "?"}: "${snip(t.text)}" (${t.id})`);
    const missing = idsArg.filter(id => !targets.some(t => t.id === id));
    if (missing.length) console.log(`  ⚠️ ไม่เจอ: ${missing.join(", ")}`);
    if (!EXECUTE) { console.log("\n👉 ใส่ --execute เพื่อลบจริง"); return; }
    const res = await prisma.review.deleteMany({ where: { id: { in: idsArg } } });
    console.log(`\n✅ ลบแล้ว ${res.count} รายการ`);
    return;
  }

  // ── 1) ดึงรีวิวสถานที่ทั้งหมด (placeId != null) ────────────────────────────
  const reviews = await prisma.review.findMany({
    where: { placeId: { not: null } },
    select: {
      id: true, authorId: true, placeId: true, tripId: true,
      rating: true, text: true, createdAt: true,
      place: { select: { title: true, slug: true, approvalStatus: true } },
      trip:  { select: { id: true, title: true, slug: true, approvalStatus: true, isPublished: true, isDraft: true } },
      author: { select: { username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // ── 2) ดึง timeline stop ที่ shareToPlace เพื่อหา "origin" ของรีวิวที่ไม่มี tripId ──
  //    (เผื่อรีวิวรั่วบางตัวถูกสร้างแบบไม่ติด tripId มา)
  const stops = await prisma.timelineStop.findMany({
    where: { shareToPlace: true, placeId: { not: null } },
    select: {
      placeId: true, description: true,
      trip: { select: { id: true, title: true, slug: true, authorId: true, approvalStatus: true, isPublished: true, isDraft: true } },
    },
  });
  // index: key = authorId|placeId → stop's trip (เลือกตัวที่ description ตรงสุดทีหลัง)
  const stopMap = new Map<string, typeof stops>();
  for (const s of stops) {
    if (!s.placeId || !s.trip) continue;
    const k = `${s.trip.authorId}|${s.placeId}`;
    const arr = stopMap.get(k) ?? [];
    arr.push(s);
    stopMap.set(k, arr);
  }

  type Action = "DELETE" | "STRIP_TRIPID" | "KEEP";
  const rows: Array<{
    action: Action; reason: string;
    place: string; placeSlug: string; author: string;
    tripId: string | null; tripStatus: string; text: string; id: string;
  }> = [];

  for (const r of reviews) {
    if (!r.placeId) continue;
    if (placeArg) {
      const hay = `${r.place?.slug ?? ""} ${r.place?.title ?? ""}`.toLowerCase();
      if (!hay.includes(placeArg)) continue;
    }

    // origin trip: ถ้ารีวิวมี tripId อยู่แล้วใช้ตัวนั้น ไม่งั้นลองจับจาก timeline stop
    let originTrip = r.trip;
    let originVia = r.trip ? "tripId" : "";
    if (!originTrip) {
      const cands = stopMap.get(`${r.authorId}|${r.placeId}`) ?? [];
      // match ข้อความ description ใกล้เคียง (ตัด tripId มาแล้วก็ยังจับ origin ได้)
      const reviewText = snip(r.text, 9999);
      const matched =
        cands.find(c => snip(c.description, 9999) === reviewText) ??
        cands.find(c => reviewText && snip(c.description, 40) && reviewText.startsWith(snip(c.description, 40))) ??
        cands[0];
      if (matched?.trip) { originTrip = matched.trip as any; originVia = "timeline-stop"; }
    }

    const placeApproved = r.place?.approvalStatus === "APPROVED";
    const tripStatusStr = originTrip
      ? `${originTrip.approvalStatus ?? "draft"}${originTrip.isPublished ? "+pub" : ""}${originTrip.isDraft ? "+draft" : ""}`
      : "ไม่พบ origin";

    let action: Action;
    let reason: string;

    if (!originTrip) {
      // รีวิวสถานที่ปกติ (ผู้ใช้เขียนเองหน้าสถานที่) ที่ไม่มี tripId และไม่ match stop ใด → ของจริง อย่าแตะ
      action = "KEEP";
      reason = "รีวิวจริงของผู้ใช้ (ไม่ได้มาจากทริป)";
    } else if (tripIsLive(originTrip) && placeApproved) {
      // ของจริงที่ควรอยู่หน้าสถานที่ — แต่ถ้ายังติด tripId ให้ตัดทิ้ง
      if (r.tripId) { action = "STRIP_TRIPID"; reason = "ทริป+สถานที่อนุมัติแล้ว แต่ยังติด tripId (กันโผล่คอมเมนต์ทริป)"; }
      else { action = "KEEP"; reason = "ของจริง อยู่หน้าสถานที่ถูกต้องแล้ว"; }
    } else {
      action = "DELETE";
      reason = !placeApproved
        ? `สถานที่ยังไม่อนุมัติ (${r.place?.approvalStatus})`
        : `ทริปยังไม่เผยแพร่/อนุมัติ (${tripStatusStr})`;
    }

    rows.push({
      action, reason,
      place: r.place?.title ?? "?", placeSlug: r.place?.slug ?? "?",
      author: r.author?.username ?? "?",
      tripId: r.tripId, tripStatus: `${tripStatusStr} [${originVia}]`,
      text: snip(r.text), id: r.id,
    });
  }

  // ── 3) รายงาน ───────────────────────────────────────────────────────────
  const del = rows.filter(r => r.action === "DELETE");
  const strip = rows.filter(r => r.action === "STRIP_TRIPID");
  const keep = rows.filter(r => r.action === "KEEP");

  const print = (title: string, list: typeof rows) => {
    if (!list.length) return;
    console.log(`\n--- ${title} (${list.length}) ---`);
    for (const r of list) {
      console.log(`  • [${r.place}] @${r.author} | trip:${r.tripStatus} | tripId:${r.tripId ?? "-"}`);
      console.log(`    เหตุผล: ${r.reason}`);
      console.log(`    ข้อความ: "${r.text}"  (review ${r.id})`);
    }
  };

  print("🗑️  ลบทิ้ง (รั่วจากทริป/สถานที่ที่ไม่อนุมัติ)", del);
  print("✂️  ตัด tripId (ของจริง คงไว้หน้าสถานที่)", strip);
  print("✅ เก็บไว้ ไม่แตะ", keep);

  // ── 4) รายงานรูป community เผื่อเช็ก (ไม่ลบ — read-time filter กรองให้แล้ว) ──
  const leakPhotoTrips = stops.filter(s => s.trip && !tripIsLive(s.trip));
  if (leakPhotoTrips.length) {
    console.log(`\n--- 📸 หมายเหตุ: timeline stop (shareToPlace) จากทริปยังไม่เผยแพร่ ${leakPhotoTrips.length} จุด ---`);
    console.log("    รูปพวกนี้ \"ไม่โผล่\" หน้าสถานที่อยู่แล้ว เพราะ query กรอง trip approved+published (place page)");
    console.log("    แสดงไว้เฉย ๆ เผื่ออยากรู้ — ไม่มีการลบ");
  }

  // ── 5) สรุป + ลงมือถ้า --execute ─────────────────────────────────────────
  console.log(`\n=== สรุป: ลบ=${del.length}  ตัดtripId=${strip.length}  เก็บ=${keep.length} ===`);

  if (!EXECUTE) {
    if (del.length || strip.length) console.log("\n👉 ใส่ --execute เพื่อลงมือจริง");
    else console.log("\nไม่มีอะไรต้องแก้ 🎉");
    return;
  }

  if (del.length) {
    const res = await prisma.review.deleteMany({ where: { id: { in: del.map(r => r.id) } } });
    console.log(`\n✅ ลบรีวิวรั่วแล้ว ${res.count} รายการ`);
  }
  if (strip.length) {
    const res = await prisma.review.updateMany({
      where: { id: { in: strip.map(r => r.id) } },
      data: { tripId: null },
    });
    console.log(`✅ ตัด tripId แล้ว ${res.count} รายการ`);
  }
  console.log("เสร็จสิ้น ✨");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
