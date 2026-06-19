/**
 * ลบ 44 รายการที่ title เป็นอักษรต่างชาติล้วนๆ
 * + รายการ "フルーツ15バーツ" (เหลือแค่ "15" หลังตัด — ไม่ใช่ชื่อสถานที่)
 *
 * Usage:
 *   node scripts/delete-foreign-titles.mjs           # dry run
 *   node scripts/delete-foreign-titles.mjs --execute # ลบจริง
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes("--execute");

// 44 รายการ title ว่างหลังตัดอักษร + #97 (フルーツ15バーツ)
const DELETE_IDS = [
  // ลาว
  "044d6ebf-f5d4-4a09-9cf5-7b68199b1bb8", // ສາມຫລ່ຽມທອງຄຳ (เชียงราย)
  "42b5ef96-3f0a-496a-b80c-149219c43ef3",  // ບ້ານຈີມ (ปทุมธานี)
  "d92ac22b-2e40-4b78-9ff6-bbe507553e07",  // ສ່ຽວແຈ໊ກ (อุตรดิตถ์)
  "8806bf23-bccc-4b7e-a591-e70908737e4e",  // ສາວບ້ານ (บึงกาฬ)
  "af17742a-a7fb-449b-98be-acafbd43a4d2",  // ອຸບົນ ຮ້ານອາຫານ ເອັດພີເຮົ້າ (อุบลฯ)
  // พม่า
  "8420f894-636c-43ca-bbba-640ffc729480",  // ကမကဖန္​႔... (ตาก แม่สอด)
  "15d6fe2e-9299-40cd-8b36-6b62b3d93ca2",  // ကျောက်ပုံတောင် (กาญจนบุรี)
  "bcb56210-b486-4844-9e0f-845f81de6135",  // တောင်အိုတောင်ကြီး (กาญจนบุรี)
  "6ec1ea54-d1ca-44eb-8731-0dcce68edaa9",  // ငရံ့တောင် (กาญจนบุรี)
  "4b631588-cc3a-410b-a12e-978309df2167",  // ခေါက်ဟွမ်နွိုင်း (ราชบุรี)
  "bf9dd114-617e-48f4-965b-7254006c3c0b",  // မင်းမဘောတောင် (ราชบุรี)
  "6d588c8e-f029-4cd2-ab8e-a371d3b005a0",  // ခေါက်လရင်တောင် (ประจวบฯ)
  "db0c4b44-4b96-43ff-b369-1f4de1b75d5f",  // ခေါက်ဒေး (ประจวบฯ)
  "832a733f-b689-4a3a-9c51-44633fac57f8",  // ခေါက်ဒိန်းရိုင် (ประจวบฯ)
  "17c94875-a29f-40bb-bd9e-0ddc4ab19042",  // ခေါက်ဒေး (ชุมพร)
  "ba7baa33-3989-4a49-ac75-d96b894a08af",  // ကျောက်ပြတောင် (ประจวบฯ)
  // เขมร
  "a2a691db-385b-4091-a23c-797d1fabd6ef",  // ភ្នំបាក់ (สระแก้ว)
  "b47026cd-6e48-40cb-81b9-673b3ce69b61",  // ម៉ាស្ជិឌទឹកថ្លា (สระแก้ว)
  "a84e3eb0-cc33-466e-a689-b3a841d8fdc6",  // វត្តប្រជាធម្មត្រ័យ (สระแก้ว)
  "921d5c08-6432-4ca3-a0bc-6a9cd6acac73",  // ព្រះសហគមន៍... (สระแก้ว)
  "6d4fc74e-f07d-4b9a-9589-c80f529d198a",  // ចៅផាយ៉ា (สระแก้ว)
  "f1d488f7-70fa-4a93-a54f-885caab7fcd0",  // ព្រះវិហារ ប៉ោយប៉ែត (สระแก้ว)
  "6f72795b-8a1e-4397-a0fa-9ac6ba44356d",  // វត្តទួលប្រាសាទ (สระแก้ว)
  "c5aef21e-d8c0-4d80-b245-682e50051e48",  // វត្ត​លោកតា​សួង (ศรีสะเกษ)
  // รัสเซีย
  "7a123050-7ed2-4508-a884-47f9e9565e61",  // Виллы (ภูเก็ต)
  "62336f23-ea42-43c4-880d-e97eb23b57df",  // Виллы (ภูเก็ต)
  "826442fa-dfa7-47e4-9ae0-e26a26854dfa",  // Водопад (ภูเก็ต)
  "150a4d90-3f43-4f41-85f3-e3e01abb74e7",  // Достопримечательность (ภูเก็ต)
  "b6d9ac1d-caf8-4542-bbed-bbcb37a4f8ab",  // Макарона (ภูเก็ต)
  "f9bd45d4-be4f-406b-88db-98ffa80dae41",  // Русская Кухня На Пхукете (ภูเก็ต)
  "5f0e1a03-7d56-419e-8edc-d98c332038ed",  // Статуя Шивы (สุราษฎร์ฯ)
  "45235762-ab87-40c6-9cd2-82ed5136848d",  // Обзорная площадка (สุราษฎร์ฯ)
  "2b6a4ec2-3bb2-43f2-8017-b59949fb8203",  // Павлины (สุราษฎร์ฯ)
  "8aafafb1-79a1-486f-b276-31c460745ab1",  // Заброшка парка... (สุราษฎร์ฯ)
  "71a2e94b-94b8-4f33-a9bd-bdbbfb6db35f",  // храм (เชียงราย)
  "f69c461f-47cb-4f59-9be8-cbd0bd37fa0d",  // Каучуковая плантация (ตราด)
  // เกาหลี
  "f9f7e959-d926-4874-944c-d8ca3a78930f",  // 블루사파이어 (กาญจนบุรี)
  "572a6b31-542d-4201-9671-661a5480ed1c",  // 힌두교사원 (ฉะเชิงเทรา)
  "c84c87c6-05e2-46b7-a10a-8938e5d81a1b",  // 황금사원 (ฉะเชิงเทรา)
  "090c5269-f4e6-4211-a553-f100cfbec86b",  // 메타창 (เชียงราย)
  "2283afdd-c800-4f89-b5fc-88824982abe2",  // 짜꼬이 (เชียงราย)
  // ญี่ปุ่น/จีน
  "85de25c0-b38a-42f2-85ad-15ef1132b019",  // 藍屋　タイ (อยุธยา)
  "9aa73f87-8cc9-46ff-a934-8c4f63eca963",  // ミカカフェ (จันทบุรี)
  "7ebadc15-8a80-4f0c-9cb2-17ab65c47a37",  // 兴龙山展望台 (เชียงใหม่)
];

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN — ไม่มีการลบจริง" : "🗑 EXECUTE — กำลังลบจริง");
  console.log();

  // ดึงข้อมูลก่อนลบ
  const records = await prisma.place.findMany({
    where: { id: { in: DELETE_IDS } },
    select: { id: true, title: true, province: true, district: true },
    orderBy: { province: "asc" },
  });

  // หา #97 (フルーツ15バーツ) โดย title
  const fruit = await prisma.place.findFirst({
    where: { title: "フルーツ15バーツ" },
    select: { id: true, title: true, province: true, district: true },
  });
  if (fruit) records.push(fruit);

  // แสดง previw
  console.log(`รายการที่จะลบ (${records.length} รายการ):`);
  for (const r of records) {
    console.log(`  [${r.province} / ${r.district}] ${r.id}  "${r.title}"`);
  }

  // ตรวจสอบ ID ที่ไม่พบในฐานข้อมูล
  const foundIds = new Set(records.map(r => r.id));
  const notFound = DELETE_IDS.filter(id => !foundIds.has(id));
  if (notFound.length > 0) {
    console.log(`\n⚠ ไม่พบในฐานข้อมูล (${notFound.length} รายการ):`);
    notFound.forEach(id => console.log(`  ${id}`));
  }

  if (DRY_RUN) {
    console.log(`\n✓ Dry run เสร็จ — รันด้วย --execute เพื่อลบจริง`);
    await prisma.$disconnect();
    return;
  }

  // ลบจริง
  console.log("\nกำลังลบ...");
  let deleted = 0;
  for (const r of records) {
    try {
      await prisma.place.delete({ where: { id: r.id } });
      console.log(`  ✓ ลบ: "${r.title}" (${r.province})`);
      deleted++;
    } catch (e) {
      console.error(`  ✗ ลบไม่ได้: ${r.id} — ${e.message}`);
    }
  }

  console.log(`\nเสร็จสิ้น — ลบ ${deleted}/${records.length} รายการ`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
