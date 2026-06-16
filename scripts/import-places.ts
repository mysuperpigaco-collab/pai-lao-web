/**
 * import-places.ts
 * ─────────────────────────────────────────────────────────────
 * อ่าน JSON จาก scripts/seed-data/{region}.json
 * เปรียบเทียบกับ DB (Haversine + name similarity)
 * นำเข้าเฉพาะที่ไม่ซ้ำ ด้วย approvalStatus = "APPROVED"
 *
 * Usage:
 *   npx ts-node scripts/import-places.ts [region|all] [--dry-run]
 *
 * Examples:
 *   npx ts-node scripts/import-places.ts north
 *   npx ts-node scripts/import-places.ts all --dry-run
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { haversine, nameSimilarity } from "../lib/geo";

const DUP_RADIUS_M   = 80;
const DUP_SIM        = 0.55;
const BATCH_SIZE     = 50;
const SEED_DIR       = path.join(__dirname, "seed-data");
const DEFAULT_IMG    = "/images/default-place.svg";

const REGIONS = ["north", "central", "east", "west", "northeast", "south"] as const;
type Region = typeof REGIONS[number];

const REGION_LABEL: Record<Region, string> = {
  north:     "ภาคเหนือ",
  central:   "ภาคกลาง",
  east:      "ภาคตะวันออก",
  west:      "ภาคตะวันตก",
  northeast: "ภาคอีสาน",
  south:     "ภาคใต้",
};

interface SeedPlace {
  osm_id?:          string;
  title:            string;
  titleEn?:         string | null;
  province:         string;
  district:         string;
  address?:         string | null;
  googleMapsUrl?:   string | null;
  lat?:             number | null;
  lng?:             number | null;
  category:         string;
  tags?:            string[];
  description?:     string | null;
  descriptionShort?: string | null;
  openHours?:       string | null;
  closedDays?:      string | null;
  entryFee?:        string | null;
  phone?:           string | null;
  website?:         string | null;
  amenities?:       string[];
  petPolicy?:       string | null;
  coverUrl?:        string;
}

interface DbPlace {
  id:       string;
  title:    string;
  lat:      number | null;
  lng:      number | null;
  province: string;
}

// ── helpers ──────────────────────────────────────────────────

function slugify(title: string, province: string): string {
  const base = title
    .normalize("NFKC")
    .replace(/[^฀-๿a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = province
    .replace(/[^฀-๿a-zA-Z0-9]/g, "")
    .slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}-${rand}`.slice(0, 80);
}

function completeness(p: SeedPlace): number {
  let s = 0;
  if (p.description && p.description.length > 60) s += 3;
  if (p.lat)         s += 2;
  if (p.titleEn)     s += 1;
  if (p.openHours)   s += 1;
  if (p.entryFee)    s += 1;
  if (p.phone)       s += 1;
  if (p.website)     s += 1;
  if ((p.tags ?? []).length > 0) s += 1;
  return s;
}

function isDupWithDb(p: SeedPlace, db: DbPlace[]): boolean {
  for (const d of db) {
    if (p.lat && p.lng && d.lat && d.lng) {
      const dist = haversine(p.lat, p.lng, d.lat, d.lng);
      if (dist <= DUP_RADIUS_M) {
        const sim = nameSimilarity(p.title, d.title);
        if (sim >= DUP_SIM) return true;
      }
    } else {
      // fallback: name + province exact
      if (
        p.title.trim() === d.title.trim() &&
        p.province === d.province
      ) return true;
    }
  }
  return false;
}

function dedupSeed(places: SeedPlace[]): SeedPlace[] {
  const out: SeedPlace[] = [];
  for (const p of places) {
    let fi = -1;
    for (let i = 0; i < out.length; i++) {
      const e = out[i];
      if (p.lat && p.lng && e.lat && e.lng) {
        const dist = haversine(p.lat, p.lng, e.lat, e.lng);
        const sim  = nameSimilarity(p.title, e.title);
        if (dist <= DUP_RADIUS_M && sim >= DUP_SIM) { fi = i; break; }
      }
    }
    if (fi === -1) {
      out.push(p);
    } else if (completeness(p) > completeness(out[fi])) {
      out[fi] = p;
    }
  }
  return out;
}

// ── main ──────────────────────────────────────────────────────

async function main() {
  const args    = process.argv.slice(2);
  const dryRun  = args.includes("--dry-run");
  // ค่าเริ่มต้น: ข้ามสถานที่ที่หาอำเภอไม่เจอ (district == province)
  // ถ้าอยากนำเข้าทั้งหมดแม้อำเภอไม่ครบ ใส่ --keep-no-district
  const keepNoDistrict = args.includes("--keep-no-district");
  const regionArg = args.find(a => !a.startsWith("--")) || "all";

  const regions: Region[] = regionArg === "all"
    ? [...REGIONS]
    : REGIONS.filter(r => r === regionArg);

  if (regions.length === 0) {
    console.error(`❌ ไม่รู้จักภาค "${regionArg}"`);
    console.error(`   ตัวเลือก: ${REGIONS.join(", ")}, all`);
    process.exit(1);
  }

  if (dryRun) console.log("🔍 DRY-RUN — ไม่ได้เขียน DB จริง\n");

  const prisma = new PrismaClient();

  // Load existing DB places (only fields we need)
  console.log("⏳ โหลดข้อมูลจาก DB...");
  const dbPlaces: DbPlace[] = await prisma.place.findMany({
    select: { id: true, title: true, lat: true, lng: true, province: true },
  });
  console.log(`   มีอยู่แล้ว ${dbPlaces.length} สถานที่ใน DB\n`);

  let totalNew = 0, totalDup = 0, totalSkipped = 0, totalNoDistrict = 0;

  for (const region of regions) {
    const label   = REGION_LABEL[region];
    const file    = path.join(SEED_DIR, `${region}.json`);

    if (!fs.existsSync(file)) {
      console.log(`⚠️  ไม่พบ ${file} — ข้ามไป`);
      console.log(`   สร้างก่อน: python scripts/fetch_places_osm_v2.py ${region}\n`);
      continue;
    }

    const raw: SeedPlace[] = JSON.parse(fs.readFileSync(file, "utf-8"));
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📍 ${label} (${region}) — ${raw.length} records ใน JSON`);
    console.log("=".repeat(60));

    // 1. dedup within JSON first
    const deduped = dedupSeed(raw);
    console.log(`   dedup ภายใน JSON: ${raw.length} → ${deduped.length}`);

    // 2. filter out DB duplicates + ตัวที่หาอำเภอไม่เจอ
    const toImport: SeedPlace[] = [];
    let dupCount = 0;
    let noDistrictCount = 0;
    for (const p of deduped) {
      if (!p.title || !p.province) { totalSkipped++; continue; }
      // ข้ามถ้าหาอำเภอไม่เจอ (district ว่าง หรือ district == province = placeholder)
      if (!keepNoDistrict && (!p.district || p.district === p.province)) {
        noDistrictCount++; totalNoDistrict++; continue;
      }
      if (isDupWithDb(p, dbPlaces)) {
        dupCount++;
      } else {
        toImport.push(p);
      }
    }
    console.log(`   หาอำเภอไม่เจอ (ข้าม): ${noDistrictCount}`);
    console.log(`   ซ้ำกับ DB: ${dupCount}`);
    console.log(`   จะนำเข้า: ${toImport.length}`);

    if (toImport.length === 0) {
      totalDup += dupCount;
      continue;
    }

    if (!dryRun) {
      // 3. batch insert
      let inserted = 0;
      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const batch = toImport.slice(i, i + BATCH_SIZE);
        const data  = batch.map(p => ({
          slug:             slugify(p.title, p.province),
          title:            p.title,
          titleEn:          p.titleEn || null,
          province:         p.province,
          district:         p.district || p.province,
          address:          p.address  || null,
          googleMapsUrl:    p.googleMapsUrl || null,
          lat:              p.lat ?? null,
          lng:              p.lng ?? null,
          category:         p.category,
          tags:             p.tags || [],
          description:      p.description || `${p.title} ตั้งอยู่ใน${p.province}`,
          descriptionShort: p.descriptionShort || null,
          openHours:        p.openHours   || null,
          closedDays:       p.closedDays  || null,
          entryFee:         p.entryFee    || null,
          phone:            p.phone       || null,
          website:          p.website     || null,
          gallery:          [],
          amenities:        p.amenities   || [],
          petPolicy:        p.petPolicy   || null,
          coverUrl:         p.coverUrl    || DEFAULT_IMG,
          approvalStatus:   "APPROVED",
        }));
        try {
          await prisma.place.createMany({ data, skipDuplicates: true });
          inserted += data.length;
          // add to in-memory DB list to block same-run dups
          for (const p of batch) {
            if (p.lat && p.lng) {
              dbPlaces.push({
                id: "new",
                title: p.title,
                lat: p.lat,
                lng: p.lng,
                province: p.province,
              });
            }
          }
        } catch (e) {
          console.error(`   ⚠️  batch error (i=${i}):`, (e as Error).message);
        }
        process.stdout.write(`\r   ✅ ${inserted}/${toImport.length}`);
      }
      console.log();
      totalNew += inserted;
    } else {
      // dry-run: print samples
      const samples = toImport.slice(0, 5);
      console.log("\n   ตัวอย่าง 5 รายการที่จะเพิ่ม:");
      for (const s of samples) {
        const coord = s.lat ? `[${s.lat.toFixed(4)}, ${s.lng?.toFixed(4)}]` : "[no coord]";
        console.log(`     • ${s.title} — ${s.province}/${s.district} ${coord}`);
      }
      totalNew += toImport.length;
    }

    totalDup += dupCount;
  }

  await prisma.$disconnect();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 สรุป${dryRun ? " (dry-run)" : ""}:`);
  console.log(`   นำเข้าใหม่: ${totalNew}`);
  console.log(`   ซ้ำ (ข้าม): ${totalDup}`);
  console.log(`   หาอำเภอไม่เจอ (ข้าม): ${totalNoDistrict}`);
  console.log(`   ข้อมูลไม่ครบ: ${totalSkipped}`);
  console.log("=".repeat(60));
  if (totalNoDistrict > 0 && !keepNoDistrict)
    console.log(`\nℹ️  ข้าม ${totalNoDistrict} ที่ที่หาอำเภอไม่เจอ — ถ้าอยากนำเข้าด้วย ใส่ --keep-no-district`);
  if (dryRun) console.log("\n💡 รันโดยไม่ --dry-run เพื่อนำเข้าจริง");
}

main().catch(e => { console.error(e); process.exit(1); });
