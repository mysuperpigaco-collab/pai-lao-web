/**
 * Simple in-memory rate limiter
 * เหมาะกับ Vercel serverless — ไม่ต้องการ Redis
 * หมายเหตุ: ใน serverless แต่ละ instance มี memory แยกกัน
 * แต่ยังช่วยป้องกัน burst request จาก IP เดียวได้ดี
 */

interface RateLimitEntry {
  count:     number;
  resetAt:   number; // timestamp ms
}

const store = new Map<string, RateLimitEntry>();

// cleanup entries ที่หมดอายุทุก 5 นาที
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => { if (v.resetAt <= now) store.delete(k); });
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;
  resetAt:    number;
}

/**
 * checkRateLimit — ตรวจสอบ rate limit
 * @param key     unique key เช่น "login:1.2.3.4"
 * @param limit   จำนวนครั้งสูงสุดใน window
 * @param windowMs window ในหน่วย ms (default 60 วินาที)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
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
}
