/**
 * Restores place titles corrupted by the broken clean-titles.mjs script.
 *
 * Strategy:
 *  1. Parse the script's own output log (original→cleaned pairs + deleted records)
 *  2. Match each corrupted DB record back to its original title via lat/lng
 *  3. Fallback: match by slug containing a number from the original title
 *  4. Fallback: match by uniqueness of the cleaned title
 *  5. For deleted records: re-insert from seed data
 *
 * Usage:
 *   node scripts/restore-titles.mjs           # dry run
 *   node scripts/restore-titles.mjs --execute # write to DB
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_FILE = "C:/Users/mysup/AppData/Local/Temp/claude/g--Project-pai-lao-web/0ab03703-06de-42db-b7b4-90ce5cefd9af/tasks/bs7wk9fn7.output";

const DRY_RUN = !process.argv.includes("--execute");
const prisma = new PrismaClient();

// ── 1. Parse output log ────────────────────────────────────────────────────────
function parseOutputLog() {
  const lines = fs.readFileSync(OUTPUT_FILE, "utf8").split("\n");
  const pairs = [];
  const deleted = [];

  for (const line of lines) {
    // Each line is: '  "JSON-escaped-original" → "JSON-escaped-cleaned"'
    const arrowIdx = line.indexOf("\" → \"");
    if (line.startsWith('  "') && arrowIdx !== -1) {
      try {
        const originalJson = line.slice(2, arrowIdx + 1);  // includes surrounding quotes
        const cleanedJson = line.slice(arrowIdx + 4).trimEnd(); // +4 skips '"', ' ', '→', ' ' to land on opening '"'
        const original = JSON.parse(originalJson);
        const cleaned = JSON.parse(cleanedJson);
        pairs.push({ original, cleaned });
      } catch { /* skip malformed lines */ }
      continue;
    }
    // Delete log: ' 🗑 ลบ: UUID "title"'
    const deleteMatch = line.match(/^ 🗑 ลบ: ([0-9a-f-]+) "(.+)"\s*$/);
    if (deleteMatch) {
      deleted.push({ id: deleteMatch[1], title: deleteMatch[2] });
    }
  }
  return { pairs, deleted };
}

// ── 2. Load seed data ──────────────────────────────────────────────────────────
function loadSeedData() {
  const byTitle = {};
  const regions = ["central", "east", "north", "northeast", "south", "west"];

  for (const r of regions) {
    const file = path.join(ROOT, "scripts", "seed-data", `${r}.json`);
    if (!fs.existsSync(file)) continue;
    for (const p of JSON.parse(fs.readFileSync(file, "utf8"))) {
      if (!byTitle[p.title]) byTitle[p.title] = p;
    }
  }

  // Parse landmark SQL for additional records (includes IDs and coords)
  const landmarkFile = path.join(ROOT, "seed_landmarks.sql");
  if (fs.existsSync(landmarkFile)) {
    const sql = fs.readFileSync(landmarkFile, "utf8");
    const re = /\('([0-9a-f-]+)','([^']+)','([^']+)','([^']+)','([^']+)','[^']*','([A-Z_]+)',(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
    let m;
    while ((m = re.exec(sql)) !== null) {
      const [, id, slug, title, province, district, category, latStr, lngStr] = m;
      if (!byTitle[title]) {
        byTitle[title] = { id, slug, title, province, district, category, lat: parseFloat(latStr), lng: parseFloat(lngStr) };
      }
    }
  }

  return byTitle;
}

// ── 3. Helpers ─────────────────────────────────────────────────────────────────
async function findByLatLng(cleanedTitle, lat, lng, epsilon = 0.0005) {
  return prisma.place.findMany({
    where: {
      title: cleanedTitle,
      lat: { gte: lat - epsilon, lte: lat + epsilon },
      lng: { gte: lng - epsilon, lte: lng + epsilon },
    },
    select: { id: true, title: true, slug: true, province: true },
  });
}

// Extract the 3-digit exhibit number from titles like "Rattanakosin Dwelling (024)"
function extractNumber(title) {
  const m = title.match(/\(0*(\d+)\)/);
  return m ? m[1].padStart(3, "0") : null;
}

// For ambiguous lat/lng: try to match by exhibit number in slug
async function findBySlugNumber(candidates, original) {
  const num = extractNumber(original);
  if (!num) return null;
  const match = candidates.find(c => c.slug.includes(`-${num}-`) || c.slug.includes(`-${num}สมุทรปรา`));
  return match || null;
}

// ── 4. Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN — no changes will be made" : "🔧 EXECUTE MODE — writing to database");
  console.log();

  const { pairs, deleted } = parseOutputLog();
  console.log(`Parsed ${pairs.length} update pairs, ${deleted.length} deleted records`);

  const seed = loadSeedData();
  console.log(`Loaded ${Object.keys(seed).length} seed records\n`);

  let restored = 0, ambiguous = 0, missing = 0;
  const unresolved = [];

  // ── Restore updated records ──────────────────────────────────────────────
  for (const pair of pairs) {
    const seedRecord = seed[pair.original];

    // Primary: lat/lng match
    if (seedRecord?.lat != null && seedRecord?.lng != null) {
      const candidates = await findByLatLng(pair.cleaned, seedRecord.lat, seedRecord.lng);

      if (candidates.length === 1) {
        console.log(`✓ [lat/lng] ${JSON.stringify(pair.cleaned)} → ${JSON.stringify(pair.original)} (${candidates[0].slug})`);
        if (!DRY_RUN) await prisma.place.update({ where: { id: candidates[0].id }, data: { title: pair.original } });
        restored++;
        continue;
      }

      if (candidates.length > 1) {
        // Fallback: slug number matching (for museum exhibits)
        const byNum = await findBySlugNumber(candidates, pair.original);
        if (byNum) {
          console.log(`✓ [slug#] ${JSON.stringify(pair.cleaned)} → ${JSON.stringify(pair.original)} (${byNum.slug})`);
          if (!DRY_RUN) await prisma.place.update({ where: { id: byNum.id }, data: { title: pair.original } });
          restored++;
          continue;
        }

        // Still ambiguous — try tighter epsilon
        const tight = await findByLatLng(pair.cleaned, seedRecord.lat, seedRecord.lng, 0.00005);
        if (tight.length === 1) {
          console.log(`✓ [tight] ${JSON.stringify(pair.cleaned)} → ${JSON.stringify(pair.original)} (${tight[0].slug})`);
          if (!DRY_RUN) await prisma.place.update({ where: { id: tight[0].id }, data: { title: pair.original } });
          restored++;
          continue;
        }

        console.warn(`⚠ AMBIGUOUS lat/lng: ${JSON.stringify(pair.original)} (${candidates.length} hits)`);
        ambiguous++;
        unresolved.push({ ...pair, reason: `ambiguous lat/lng (${candidates.length})`, candidates });
        continue;
      }
      // 0 hits from lat/lng — fall through to uniqueness check
    }

    // Fallback: unique cleaned title in whole DB
    const allWithCleaned = await prisma.place.findMany({
      where: { title: pair.cleaned },
      select: { id: true, slug: true, province: true },
    });

    if (allWithCleaned.length === 1) {
      console.log(`✓ [unique] ${JSON.stringify(pair.cleaned)} → ${JSON.stringify(pair.original)} (${allWithCleaned[0].slug})`);
      if (!DRY_RUN) await prisma.place.update({ where: { id: allWithCleaned[0].id }, data: { title: pair.original } });
      restored++;
    } else if (allWithCleaned.length === 0) {
      console.warn(`✗ NOT FOUND: ${JSON.stringify(pair.original)} (cleaned: ${JSON.stringify(pair.cleaned)})`);
      missing++;
      unresolved.push({ ...pair, reason: "not found in DB" });
    } else {
      // Last resort: slug number match across all candidates
      const byNum = await findBySlugNumber(allWithCleaned, pair.original);
      if (byNum) {
        console.log(`✓ [slug# global] ${JSON.stringify(pair.cleaned)} → ${JSON.stringify(pair.original)} (${byNum.slug})`);
        if (!DRY_RUN) await prisma.place.update({ where: { id: byNum.id }, data: { title: pair.original } });
        restored++;
      } else {
        console.warn(`⚠ AMBIGUOUS: ${JSON.stringify(pair.original)} → ${allWithCleaned.length} rows`);
        ambiguous++;
        unresolved.push({ ...pair, reason: `${allWithCleaned.length} candidates`, candidates: allWithCleaned });
      }
    }
  }

  console.log(`\n── Update results: ✓ ${restored} restored | ⚠ ${ambiguous} ambiguous | ✗ ${missing} not found ──\n`);

  // ── Re-insert deleted records ──────────────────────────────────────────────
  let reinserted = 0, deletedMissing = 0;

  for (const del of deleted) {
    const seedRecord = seed[del.title];
    if (!seedRecord) {
      console.warn(`✗ DELETED but not in seed: ${del.id} ${JSON.stringify(del.title)}`);
      deletedMissing++;
      continue;
    }

    const existing = await prisma.place.findUnique({ where: { id: del.id }, select: { id: true } });
    if (existing) {
      console.log(`→ Already exists: ${del.id}`);
      continue;
    }

    console.log(`♻ RE-INSERT: ${del.id} ${JSON.stringify(del.title)} (${seedRecord.province})`);
    reinserted++;

    if (!DRY_RUN) {
      const slug = seedRecord.slug || `restore-${del.id.slice(0, 8)}`;
      // Ensure slug uniqueness
      const slugExists = await prisma.place.findUnique({ where: { slug }, select: { id: true } });
      const finalSlug = slugExists ? `restore-${del.id.slice(0, 8)}-${Date.now()}` : slug;

      try {
        await (prisma).place.create({
          data: {
            id: del.id,
            slug: finalSlug,
            title: del.title,
            titleEn: seedRecord.titleEn || null,
            province: seedRecord.province || "",
            district: seedRecord.district || "",
            address: seedRecord.address || null,
            googleMapsUrl: seedRecord.googleMapsUrl || null,
            lat: seedRecord.lat ?? null,
            lng: seedRecord.lng ?? null,
            category: seedRecord.category || "ATTRACTION",
            tags: seedRecord.tags || [],
            amenities: seedRecord.amenities || [],
            coverUrl: seedRecord.coverUrl || "/images/default-place.svg",
            gallery: seedRecord.gallery || [],
            description: seedRecord.description || "",
            descriptionShort: seedRecord.descriptionShort || null,
            approvalStatus: "APPROVED",
          },
        });
      } catch (e) {
        console.error(`  → INSERT FAILED: ${e.message}`);
        reinserted--;
        deletedMissing++;
      }
    }
  }

  console.log(`── Delete restore: ♻ ${reinserted} re-inserted | ✗ ${deletedMissing} not in seed ──\n`);

  if (unresolved.length > 0) {
    console.log("=== UNRESOLVED (need manual fix) ===");
    for (const u of unresolved) {
      console.log(`  [${u.reason}] ${JSON.stringify(u.original)} → ${JSON.stringify(u.cleaned)}`);
      if (u.candidates?.length) {
        u.candidates.slice(0, 3).forEach(c => console.log(`    • ${c.slug} | ${c.province}`));
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
