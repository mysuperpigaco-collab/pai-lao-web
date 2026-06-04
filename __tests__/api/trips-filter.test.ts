import { describe, it, expect } from "vitest";

// ── test logic การสร้าง where clause ของ /api/trips ──────────
type WhereClause = Record<string, any>;

function buildWhere(params: {
  includeUnpublished: boolean;
  mood?: string;
  authorId?: string;
  q?: string;
}): WhereClause {
  const { includeUnpublished, mood, authorId, q } = params;
  const where: WhereClause = {
    ...(!includeUnpublished
      ? { isPublished: true, approvalStatus: "APPROVED", isDraft: false }
      : { isDraft: false }),
    ...(mood     ? { mood }               : {}),
    ...(authorId ? { authorId }           : {}),
    ...(q ? { OR: [
      { title:    { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
    ]} : {}),
  };
  return where;
}

describe("/api/trips — where clause builder", () => {
  it("public query กรองเฉพาะ published + approved", () => {
    const where = buildWhere({ includeUnpublished: false });
    expect(where.isPublished).toBe(true);
    expect(where.approvalStatus).toBe("APPROVED");
    expect(where.isDraft).toBe(false);
  });

  it("mine=1 ไม่กรอง isPublished แต่กรอง isDraft:false", () => {
    const where = buildWhere({ includeUnpublished: true });
    expect(where.isPublished).toBeUndefined();
    expect(where.isDraft).toBe(false);
  });

  it("filter mood เพิ่มใน where", () => {
    const where = buildWhere({ includeUnpublished: false, mood: "Cafe Hopping" });
    expect(where.mood).toBe("Cafe Hopping");
  });

  it("filter authorId เพิ่มใน where", () => {
    const where = buildWhere({ includeUnpublished: false, authorId: "user-123" });
    expect(where.authorId).toBe("user-123");
  });

  it("search query สร้าง OR clause", () => {
    const where = buildWhere({ includeUnpublished: false, q: "เชียงใหม่" });
    expect(Array.isArray(where.OR)).toBe(true);
    expect(where.OR[0].title.contains).toBe("เชียงใหม่");
  });

  it("ไม่มี mood ไม่เพิ่ม mood ใน where", () => {
    const where = buildWhere({ includeUnpublished: false });
    expect(where.mood).toBeUndefined();
  });
});
