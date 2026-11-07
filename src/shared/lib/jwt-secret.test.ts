import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("JWT secret", () => {
  it("refuses to sign a token without JWT_SECRET (no fallback secret)", async () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.resetModules();
    const { signToken } = await import("./auth");
    await expect(signToken({ type: "admin", adminId: "a" } as never)).rejects.toThrow("JWT_SECRET is not set");
  });

  it("without JWT_SECRET nobody is logged in, even with a token signed by the old fallback", async () => {
    const { SignJWT } = await import("jose");
    const forged = await new SignJWT({ adminId: "a", type: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("fallback-secret"));
    vi.stubEnv("JWT_SECRET", "");
    vi.resetModules();
    const { verifyToken } = await import("./auth");
    expect(await verifyToken(forged)).toBeNull();
  });
});
