import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 💡 เปลี่ยนจาก DATABASE_URL มาเป็น DIRECT_URL เพื่อแก้ปัญหาอาการค้างตอนสั่ง Push
    url: env("DIRECT_URL"),
  },
});
