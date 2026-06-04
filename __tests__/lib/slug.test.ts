import { describe, it, expect } from "vitest";

// slug generation logic (ดึงมาจาก /api/trips POST)
function generateSlug(title: string): string {
  const titleSlug = title
    .replace(/[^a-zA-Z0-9฀-๿]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "trip";
  return `${titleSlug}-stub`; // ใช้ stub แทน Date.now()
}

describe("slug generation", () => {
  it("ชื่อภาษาไทยไม่มี special chars", () => {
    const slug = generateSlug("น้ำตกแม่กลอง");
    expect(slug).toMatch(/^[a-z0-9ก-๿-]+-stub$/);
  });

  it("ชื่อภาษาอังกฤษ lowercase", () => {
    const slug = generateSlug("Beach Trip");
    expect(slug).toBe("beach-trip-stub");
  });

  it("ชื่อมี special chars ถูก replace ด้วย -", () => {
    const slug = generateSlug("Trip!! @2025");
    expect(slug).not.toContain("!");
    expect(slug).not.toContain("@");
  });

  it("ชื่อว่าง fallback เป็น trip", () => {
    const slug = generateSlug("");
    expect(slug).toBe("trip-stub");
  });

  it("ชื่อมี spaces หลายตัวต่อกัน collapse เป็น -", () => {
    const slug = generateSlug("hello   world");
    expect(slug).toBe("hello-world-stub");
  });
});
