import { describe, expect, it } from "vitest";
import {
  getPasswordChecks,
  isPasswordValid,
  PASSWORD_RULE_ERROR,
} from "@/lib/auth/password-rules";

describe("password-rules", () => {
  it("rejects short passwords", () => {
    expect(isPasswordValid("Ab1!")).toBe(false);
  });

  it("rejects passwords without numbers", () => {
    expect(isPasswordValid("password!")).toBe(false);
  });

  it("rejects passwords without symbols", () => {
    expect(isPasswordValid("password1")).toBe(false);
  });

  it("rejects passwords without letters", () => {
    expect(isPasswordValid("12345678!")).toBe(false);
  });

  it("accepts password meeting all rules", () => {
    expect(isPasswordValid("password1!")).toBe(true);
  });

  it("does not require first letter to be capital", () => {
    expect(isPasswordValid("password1!")).toBe(true);
    expect(isPasswordValid("Password1!")).toBe(true);
  });

  it("returns 4 checks", () => {
    const checks = getPasswordChecks("password1!");
    expect(checks).toHaveLength(4);
    expect(checks.every((c) => c.met)).toBe(true);
  });

  it("error message references all required pieces", () => {
    expect(PASSWORD_RULE_ERROR).toMatch(/8 karakter/);
    expect(PASSWORD_RULE_ERROR).toMatch(/huruf/);
    expect(PASSWORD_RULE_ERROR).toMatch(/angka/);
    expect(PASSWORD_RULE_ERROR).toMatch(/simbol/);
  });
});
