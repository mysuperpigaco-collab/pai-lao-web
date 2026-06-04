import { describe, it, expect } from "vitest";

// ── ลอก logic จาก StoryCard เพื่อ test แยก ──────────────────
type TripItem = {
  isPublished?: boolean;
  approvalStatus?: string;
  hasPendingEdit?: boolean;
};

function getBadgeLabel(story: TripItem): string {
  const published   = story.isPublished === true;
  const pendingEdit = story.hasPendingEdit === true;
  if (pendingEdit) return "รออนุมัติการแก้ไข · Pending";
  if (published || story.approvalStatus === "APPROVED") return "เผยแพร่แล้ว · Published";
  if (story.approvalStatus === "PENDING")   return "รออนุมัติ · Pending";
  if (story.approvalStatus === "REJECTED")  return "ถูกปฏิเสธ · Rejected";
  return "ฉบับร่าง · Draft";
}

describe("StoryCard — badge label logic", () => {
  it("Published trip แสดง เผยแพร่แล้ว", () => {
    expect(getBadgeLabel({ isPublished: true, approvalStatus: "APPROVED" })).toBe("เผยแพร่แล้ว · Published");
  });

  it("APPROVED แต่ isPublished false (unpublished by admin) แสดง เผยแพร่แล้ว", () => {
    expect(getBadgeLabel({ isPublished: false, approvalStatus: "APPROVED" })).toBe("เผยแพร่แล้ว · Published");
  });

  it("PENDING approval แสดง รออนุมัติ", () => {
    expect(getBadgeLabel({ isPublished: false, approvalStatus: "PENDING" })).toBe("รออนุมัติ · Pending");
  });

  it("REJECTED แสดง ถูกปฏิเสธ", () => {
    expect(getBadgeLabel({ isPublished: false, approvalStatus: "REJECTED" })).toBe("ถูกปฏิเสธ · Rejected");
  });

  it("limbo state (isDraft:false, approvalStatus:null) แสดง ฉบับร่าง", () => {
    expect(getBadgeLabel({ isPublished: false, approvalStatus: undefined })).toBe("ฉบับร่าง · Draft");
  });

  it("hasPendingEdit แสดง รออนุมัติการแก้ไข แม้ published อยู่", () => {
    expect(getBadgeLabel({ isPublished: true, approvalStatus: "APPROVED", hasPendingEdit: true }))
      .toBe("รออนุมัติการแก้ไข · Pending");
  });
});
