import { describe, expect, it } from "vitest";
import { validateSafeRedirect } from "@/server/security/redirect";

describe("validateSafeRedirect", () => {
  it("allows safe internal paths", () => {
    expect(validateSafeRedirect("/")).toBe("/");
    expect(validateSafeRedirect("/account")).toBe("/account");
    expect(validateSafeRedirect("/account/purchases")).toBe("/account/purchases");
    expect(validateSafeRedirect("/checkout")).toBe("/checkout");
    expect(validateSafeRedirect("/projects/vtu-kit-1")).toBe("/projects/vtu-kit-1");
    expect(validateSafeRedirect("/admin?tab=projects")).toBe("/admin?tab=projects");
  });

  it("falls back for null, undefined, or empty values", () => {
    expect(validateSafeRedirect(null)).toBe("/");
    expect(validateSafeRedirect(undefined)).toBe("/");
    expect(validateSafeRedirect("")).toBe("/");
    expect(validateSafeRedirect("   ")).toBe("/");
    expect(validateSafeRedirect(null, "/account")).toBe("/account");
  });

  it("blocks protocol-relative URLs", () => {
    expect(validateSafeRedirect("//evil.com")).toBe("/");
    expect(validateSafeRedirect("//attacker.org/account")).toBe("/");
    expect(validateSafeRedirect("///evil.com")).toBe("/");
  });

  it("blocks backslash variants and path traversal attempts", () => {
    expect(validateSafeRedirect("/\\evil.com")).toBe("/");
    expect(validateSafeRedirect("\\evil.com")).toBe("/");
    expect(validateSafeRedirect("/account\\evil")).toBe("/");
  });

  it("blocks absolute URLs and protocols", () => {
    expect(validateSafeRedirect("https://evil.com")).toBe("/");
    expect(validateSafeRedirect("http://evil.com/account")).toBe("/");
    expect(validateSafeRedirect("javascript:alert(1)")).toBe("/");
    expect(validateSafeRedirect("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(validateSafeRedirect("ftp://files.com")).toBe("/");
  });

  it("blocks URL-encoded bypasses", () => {
    expect(validateSafeRedirect("/%2Fevil.com")).toBe("/");
    expect(validateSafeRedirect("/%5Cevil.com")).toBe("/");
    expect(validateSafeRedirect("/account%3Atest")).toBe("/");
    expect(validateSafeRedirect("%2F%2Fevil.com")).toBe("/");
  });

  it("blocks unlisted external-looking paths", () => {
    expect(validateSafeRedirect("/evil-domain")).toBe("/");
    expect(validateSafeRedirect("/unknown/endpoint")).toBe("/");
    expect(validateSafeRedirect("/api/secret")).toBe("/");
  });
});
