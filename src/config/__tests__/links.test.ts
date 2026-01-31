/**
 * @file links.test.ts
 * @description Tests for External Links configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { SUPPORT_WHATSAPP_URL, HELP_CENTER_URL } from "../links";

// ============================================================================
// SUPPORT_WHATSAPP_URL
// ============================================================================

describe("SUPPORT_WHATSAPP_URL", () => {
  it("should be defined", () => {
    expect(SUPPORT_WHATSAPP_URL).toBeDefined();
  });

  it("should be a string", () => {
    expect(typeof SUPPORT_WHATSAPP_URL).toBe("string");
  });

  it("should be a valid WhatsApp URL", () => {
    expect(SUPPORT_WHATSAPP_URL).toMatch(/^https:\/\/wa\.me\//);
  });

  it("should contain a phone number", () => {
    expect(SUPPORT_WHATSAPP_URL).toMatch(/wa\.me\/\d+/);
  });

  it("should have a pre-filled message", () => {
    expect(SUPPORT_WHATSAPP_URL).toContain("?text=");
  });

  it("should have URL-encoded message", () => {
    const url = new URL(SUPPORT_WHATSAPP_URL);
    const text = url.searchParams.get("text");
    expect(text).toBeTruthy();
    expect(text).toContain("Rise Checkout");
  });
});

// ============================================================================
// HELP_CENTER_URL
// ============================================================================

describe("HELP_CENTER_URL", () => {
  it("should be defined", () => {
    expect(HELP_CENTER_URL).toBeDefined();
  });

  it("should be a string", () => {
    expect(typeof HELP_CENTER_URL).toBe("string");
  });

  it("should be a valid HTTPS URL", () => {
    expect(HELP_CENTER_URL).toMatch(/^https:\/\//);
  });

  it("should not have trailing slash", () => {
    expect(HELP_CENTER_URL).not.toMatch(/\/$/);
  });
});

// ============================================================================
// URL Validation
// ============================================================================

describe("URL Validation", () => {
  it("SUPPORT_WHATSAPP_URL should be a valid URL object", () => {
    expect(() => new URL(SUPPORT_WHATSAPP_URL)).not.toThrow();
  });

  it("HELP_CENTER_URL should be a valid URL object", () => {
    expect(() => new URL(HELP_CENTER_URL)).not.toThrow();
  });

  it("all URLs should use secure protocol", () => {
    expect(SUPPORT_WHATSAPP_URL).toMatch(/^https:/);
    expect(HELP_CENTER_URL).toMatch(/^https:/);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should not have undefined URLs", () => {
    expect(SUPPORT_WHATSAPP_URL).not.toBeUndefined();
    expect(HELP_CENTER_URL).not.toBeUndefined();
  });

  it("should not have null URLs", () => {
    expect(SUPPORT_WHATSAPP_URL).not.toBeNull();
    expect(HELP_CENTER_URL).not.toBeNull();
  });

  it("should not have empty URLs", () => {
    expect(SUPPORT_WHATSAPP_URL).not.toBe("");
    expect(HELP_CENTER_URL).not.toBe("");
  });

  it("should not have malformed URLs", () => {
    // URLs can have encoded spaces in query params, so we check the structure
    expect(() => new URL(SUPPORT_WHATSAPP_URL)).not.toThrow();
    expect(() => new URL(HELP_CENTER_URL)).not.toThrow();
  });
});
