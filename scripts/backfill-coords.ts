/**
 * Backfill lat/lng from googleMapsUrl for Place rows that have a URL but no coords.
 *
 * Usage:
 *   npx tsx scripts/backfill-coords.ts
 *
 * ⚠️ snapshot/backup the DB before running (low risk — only writes rows with null lat/lng)
 */

import { PrismaClient } from "@prisma/client";
import { extractLatLngFromGoogleUrl, googleUrlToLatLng } from "@/lib/maps";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.place.findMany({
    where: {
      googleMapsUrl: { not: null },
      OR: [{ lat: null }, { lng: null }],
    },
    select: { id: true, title: true, googleMapsUrl: true },
  });

  console.log(`Found ${rows.length} places with googleMapsUrl but missing lat/lng`);

  let ok = 0;
  let skip = 0;

  for (const r of rows) {
    const url = r.googleMapsUrl!;
    // Try sync extraction first (no network), then async resolve for short URLs
    const direct = extractLatLngFromGoogleUrl(url);
    const c = direct ?? (await googleUrlToLatLng(url));

    if (c) {
      await prisma.place.update({
        where: { id: r.id },
        data: { lat: c.lat, lng: c.lng },
      });
      console.log(`  ✓ [${r.title}] → ${c.lat}, ${c.lng}`);
      ok++;
    } else {
      console.log(`  ✗ [${r.title}] — could not extract coords from: ${url}`);
      skip++;
    }

    // Rate-limit when resolving short links
    await new Promise(res => setTimeout(res, 200));
  }

  console.log(`\nDone: ${ok} updated, ${skip} skipped`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
