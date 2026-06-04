// @vitest-environment node
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth";

describe("auth — password", () => {
  it("hashPassword สร้าง hash ที่ไม่ใช่ plain text", async () => {
    const hash = await hashPassword("MyP@ssw0rd");
    expect(hash).not.toBe("MyP@ssw0rd");
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  it("verifyPassword คืน true เมื่อรหัสถูก", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("verifyPassword คืน false เมื่อรหัสผิด", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrongpass", hash)).toBe(false);
  });
});

describe("auth — JWT", () => {
  const payload = { userId: "abc-123", username: "tonpp", role: "TRAVELER" as const };

  it("signToken สร้าง token string", async () => {
    const token = await signToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT format
  });

  it("verifyToken คืน payload ที่ถูกต้อง", async () => {
    const token = await signToken(payload);
    const result = await verifyToken(token);
    expect(result?.userId).toBe(payload.userId);
    expect(result?.username).toBe(payload.username);
    expect(result?.role).toBe(payload.role);
  });

  it("verifyToken คืน null เมื่อ token ไม่ถูกต้อง", async () => {
    const result = await verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("verifyToken คืน null เมื่อ token ว่าง", async () => {
    const result = await verifyToken("");
    expect(result).toBeNull();
  });
});
