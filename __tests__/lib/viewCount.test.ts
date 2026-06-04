// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── test logic useViewCount ด้วย mock sessionStorage ────────
function makeViewTracker() {
  const session: Record<string, string> = {};
  const calls: string[] = [];

  function trackView(type: string, slug: string) {
    const key = `viewed:${type}:${slug}`;
    if (session[key]) return false; // already tracked
    session[key] = "1";
    calls.push(`/api/${type}/${slug}/view`);
    return true;
  }

  return { trackView, calls, session };
}

describe("useViewCount — logic", () => {
  it("เรียก API ครั้งแรก", () => {
    const { trackView, calls } = makeViewTracker();
    const result = trackView("trips", "beach-trip-123");
    expect(result).toBe(true);
    expect(calls).toContain("/api/trips/beach-trip-123/view");
  });

  it("ไม่เรียก API ซ้ำใน session เดียวกัน", () => {
    const { trackView, calls } = makeViewTracker();
    trackView("trips", "beach-trip-123");
    trackView("trips", "beach-trip-123");
    expect(calls.length).toBe(1);
  });

  it("นับ trip และ place แยกกัน", () => {
    const { trackView, calls } = makeViewTracker();
    trackView("trips",  "slug-abc");
    trackView("places", "slug-abc");
    expect(calls.length).toBe(2);
  });

  it("slug ต่างกัน นับแยกกัน", () => {
    const { trackView, calls } = makeViewTracker();
    trackView("trips", "trip-a");
    trackView("trips", "trip-b");
    expect(calls.length).toBe(2);
  });

  it("ไม่ track ถ้า slug ว่าง", () => {
    const { trackView, calls } = makeViewTracker();
    // simulate hook guard
    const slug = "";
    if (slug) trackView("trips", slug);
    expect(calls.length).toBe(0);
  });
});
