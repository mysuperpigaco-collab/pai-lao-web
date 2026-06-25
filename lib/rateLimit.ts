/**
 * Rate limiter — ใช้ Upstash Redis (sliding window)
 * แก้ปัญหา in-memory เดิม: state ไม่ข้าม instance + รีเซ็ตตอน cold start
 * ตอนนี้ใช้ Redis กลาง → นับรวมทุก instance + ไม่รีเซ็ต
 *
 * env (Vercel ตั้งให้อัตโนมัติจาก Upstash integration):
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 *
 * Fail-open: ถ้า Redis ใช้ไม่ได้ จะปล่อยผ่าน (allowed:true) เพื่อไม่ให้เว็บล่มตาม Redis
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

// cache instance ตาม (limit, window) กันสร้างซ้ำ + ephemeralCache ลด Redis call ของ key ร้อน ๆ ใน instance เดียว
const limiters = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${limit}:${windowMs}`;
  let rl = limiters.get(cacheKey);
  if (!rl) {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s` as any),
      prefix: "rl",
      analytics: false,
      ephemeralCache: new Map(),
    });
    limiters.set(cacheKey, rl);
  }
  return rl;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // timestamp ms
}

/**
 * checkRateLimit — ตรวจ rate limit (async)
 * @param key      unique key เช่น "login:1.2.3.4"
 * @param limit    จำนวนครั้งสูงสุดใน window
 * @param windowMs window ในหน่วย ms (default 60 วินาที)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  // ไม่ได้ตั้ง Redis (เช่น dev เครื่องที่ยังไม่ pull env) → ปล่อยผ่าน
  if (!limiter) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
  try {
    const r = await limiter.limit(key);
    return { allowed: r.success, remaining: r.remaining, resetAt: r.reset };
  } catch (err) {
    console.error("[rateLimit] Redis error — fail open:", err);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}
