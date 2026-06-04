// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── inline reimplementation เพื่อ test แยก state ────────────
interface Entry { count: number; resetAt: number }

function makeRateLimiter() {
  const store = new Map<string, Entry>();

  return function checkRateLimit(key: string, limit: number, windowMs = 60_000) {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    entry.count += 1;
    if (entry.count > limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  };
}

describe("checkRateLimit", () => {
  it("อนุญาต request แรก", () => {
    const check = makeRateLimiter();
    const result = check("login:1.2.3.4", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("นับ request ถูกต้อง", () => {
    const check = makeRateLimiter();
    check("ip:1", 3);
    check("ip:1", 3);
    const r = check("ip:1", 3);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(0);
  });

  it("block เมื่อเกิน limit", () => {
    const check = makeRateLimiter();
    for (let i = 0; i < 5; i++) check("ip:x", 5);
    const r = check("ip:x", 5);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("key ต่างกันไม่กระทบกัน", () => {
    const check = makeRateLimiter();
    for (let i = 0; i < 5; i++) check("ip:a", 5);
    check("ip:a", 5); // block
    const r = check("ip:b", 5); // คนละ key
    expect(r.allowed).toBe(true);
  });

  it("reset หลัง window หมดอายุ", () => {
    const check = makeRateLimiter();
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) check("ip:r", 5);
    check("ip:r", 5); // block

    vi.advanceTimersByTime(61_000); // เดิน 61 วินาที

    const r = check("ip:r", 5);
    expect(r.allowed).toBe(true); // reset แล้ว
    vi.useRealTimers();
  });
});
