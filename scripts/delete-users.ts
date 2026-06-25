/**
 * ลบบัญชีผู้ใช้ (สำหรับเทสต์) — ลบลูกแบบ cascade อัตโนมัติ (trips, reviews, bookmarks, likes, follows ฯลฯ)
 *
 * Usage:
 *   npx tsx scripts/delete-users.ts                      # dry-run รายการดีฟอลต์ (ไม่ลบจริง)
 *   npx tsx scripts/delete-users.ts --execute            # ลบจริง รายการดีฟอลต์
 *   npx tsx scripts/delete-users.ts --users=a,b,c        # ระบุเอง (username หรือ email)
 *   npx tsx scripts/delete-users.ts --users=a,b --execute
 *
 * ป้องกัน: จะไม่ลบบัญชี ADMIN / SUPERADMIN
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// รายการดีฟอลต์ที่ต้องการลบ (username หรือ email)
const DEFAULT_TARGETS = ["supportlao@gmail.com", "supportpailao@gmail.com", "Ninew", "TheKtest01"];

const execute = process.argv.includes("--execute");
const usersArg = process.argv.find(a => a.startsWith("--users="));
const targets = usersArg
  ? usersArg.replace("--users=", "").split(",").map(s => s.trim()).filter(Boolean)
  : DEFAULT_TARGETS;

async function main() {
  console.log(`\n=== ลบบัญชีผู้ใช้ (${execute ? "EXECUTE — ลบจริง" : "DRY-RUN — ยังไม่ลบ"}) ===\n`);
  console.log("เป้าหมาย:", targets.join(", "), "\n");

  for (const t of targets) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: t, mode: "insensitive" } },
          { email: { equals: t, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, username: true, email: true, role: true, authProvider: true,
        _count: { select: { trips: true, reviews: true, bookmarks: true, tripPlans: true } },
      },
    });

    if (!user) {
      console.log(`❓ ไม่พบ: ${t}`);
      continue;
    }

    if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
      console.log(`⛔ ข้าม (เป็น ${user.role}): @${user.username} ${user.email}`);
      continue;
    }

    const c = user._count;
    console.log(
      `${execute ? "🗑️ ลบ" : "• จะลบ"}: @${user.username} (${user.email}) · ${user.role}/${user.authProvider}` +
      ` · trips:${c.trips} reviews:${c.reviews} bookmarks:${c.bookmarks} plans:${c.tripPlans}`
    );

    if (execute) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`   ✅ ลบเรียบร้อย (ข้อมูลที่ผูกอยู่ถูกลบแบบ cascade)`);
    }
  }

  if (!execute) {
    console.log(`\n👉 ตรวจรายการด้านบนแล้ว ถ้าถูกต้องให้รันซ้ำพร้อม --execute เพื่อลบจริง`);
  }
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
