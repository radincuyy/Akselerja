import { describe, expect, it } from "vitest";
import { buildPasswordResetEmailHtml } from "@/lib/resend-email";

describe("resend-email", () => {
  it("renders a branded password reset email", () => {
    const html = buildPasswordResetEmailHtml({
      to: "maya@example.com",
      name: "Maya",
      resetUrl: "https://akselerja.id/reset-password?email=maya%40example.com&token=abc123",
      expiresInMinutes: 30,
    });

    expect(html).toContain("Akselerja");
    expect(html).toContain("Reset password sekarang");
    expect(html).toContain("Maya");
    expect(html).toContain("30 menit");
    expect(html).toContain("maya%40example.com&amp;token=abc123");
  });
});
