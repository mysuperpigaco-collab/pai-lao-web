import { describe, it, expect } from "vitest";

// ── test logic การกรอง announcement ──────────────────────────
type Announcement = {
  isActive: boolean;
  expiresAt: Date | null;
  targetRole: string | null;
};

function isVisibleTo(ann: Announcement, userRole: string, now: Date): boolean {
  if (!ann.isActive) return false;
  if (ann.expiresAt && ann.expiresAt <= now) return false;
  if (ann.targetRole && ann.targetRole !== userRole) return false;
  return true;
}

describe("Announcement — visibility logic", () => {
  const now = new Date("2026-06-04T12:00:00Z");

  it("active + ไม่หมดอายุ + ทุกคน → แสดง", () => {
    expect(isVisibleTo({ isActive: true, expiresAt: null, targetRole: null }, "TRAVELER", now)).toBe(true);
  });

  it("isActive:false → ซ่อน", () => {
    expect(isVisibleTo({ isActive: false, expiresAt: null, targetRole: null }, "TRAVELER", now)).toBe(false);
  });

  it("หมดอายุแล้ว → ซ่อน", () => {
    const expired = new Date("2026-06-01T00:00:00Z");
    expect(isVisibleTo({ isActive: true, expiresAt: expired, targetRole: null }, "TRAVELER", now)).toBe(false);
  });

  it("ยังไม่หมดอายุ → แสดง", () => {
    const future = new Date("2026-12-31T00:00:00Z");
    expect(isVisibleTo({ isActive: true, expiresAt: future, targetRole: null }, "TRAVELER", now)).toBe(true);
  });

  it("targetRole ตรงกัน → แสดง", () => {
    expect(isVisibleTo({ isActive: true, expiresAt: null, targetRole: "TRAVELER" }, "TRAVELER", now)).toBe(true);
  });

  it("targetRole ไม่ตรงกัน → ซ่อน", () => {
    expect(isVisibleTo({ isActive: true, expiresAt: null, targetRole: "BUSINESS" }, "TRAVELER", now)).toBe(false);
  });

  it("targetRole null → แสดงทุก role", () => {
    expect(isVisibleTo({ isActive: true, expiresAt: null, targetRole: null }, "BUSINESS", now)).toBe(true);
    expect(isVisibleTo({ isActive: true, expiresAt: null, targetRole: null }, "ADMIN", now)).toBe(true);
  });
});
