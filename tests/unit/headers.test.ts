import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Security Headers via Middleware", () => {
  it("attaches all required security headers and ensures X-Powered-By is absent", () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);

    const headers = response.headers;

    // Verify presence of mandatory security headers
    expect(headers.get("Content-Security-Policy")).toBeTruthy();
    expect(headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");

    expect(headers.get("Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
    );
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");

    // Verify absence of sensitive disclosure header
    expect(headers.get("X-Powered-By")).toBeNull();
  });
});
