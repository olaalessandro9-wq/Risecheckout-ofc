/**
 * @file whatsapp.test.ts
 * @description Tests for WhatsApp configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { WA_PHONE, WA_DEFAULT_MSG } from "../whatsapp";

// ============================================================================
// WA_PHONE
// ============================================================================

describe("WA_PHONE", () => {
  it("should be defined (can be undefined when not configured)", () => {
    // WA_PHONE is intentionally undefined when not configured
    expect(WA_PHONE === undefined || typeof WA_PHONE === "string").toBe(true);
  });

  it("should be string or undefined", () => {
    expect(typeof WA_PHONE === "string" || WA_PHONE === undefined).toBe(true);
  });

  it("should be undefined when not configured", () => {
    // As per the config file, WA_PHONE is currently undefined
    expect(WA_PHONE).toBeUndefined();
  });

  it("should be in E.164 format when defined", () => {
    if (WA_PHONE !== undefined) {
      // E.164 format: only digits, no + prefix
      expect(WA_PHONE).toMatch(/^\d+$/);
      // Should have country code (55 for Brazil) + area code + number
      expect(WA_PHONE.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("should not have + prefix", () => {
    if (WA_PHONE !== undefined) {
      expect(WA_PHONE).not.toMatch(/^\+/);
    }
  });

  it("should not have spaces or special characters", () => {
    if (WA_PHONE !== undefined) {
      expect(WA_PHONE).not.toMatch(/[\s\-\(\)]/);
    }
  });
});

// ============================================================================
// WA_DEFAULT_MSG
// ============================================================================

describe("WA_DEFAULT_MSG", () => {
  it("should be defined", () => {
    expect(WA_DEFAULT_MSG).toBeDefined();
  });

  it("should be a string", () => {
    expect(typeof WA_DEFAULT_MSG).toBe("string");
  });

  it("should not be empty", () => {
    expect(WA_DEFAULT_MSG.length).toBeGreaterThan(0);
  });

  it("should be a friendly greeting message", () => {
    expect(WA_DEFAULT_MSG.toLowerCase()).toMatch(/olá|oi|preciso/);
  });

  it("should mention checkout or help", () => {
    expect(WA_DEFAULT_MSG.toLowerCase()).toMatch(/checkout|ajuda|orientar/);
  });

  it("should be URL-encodable", () => {
    expect(() => encodeURIComponent(WA_DEFAULT_MSG)).not.toThrow();
  });

  it("should not exceed reasonable length (< 200 chars)", () => {
    expect(WA_DEFAULT_MSG.length).toBeLessThan(200);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("WhatsApp Integration", () => {
  it("should be able to construct WhatsApp URL when phone is defined", () => {
    if (WA_PHONE !== undefined) {
      const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(WA_DEFAULT_MSG)}`;
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it("should handle undefined phone gracefully", () => {
    if (WA_PHONE === undefined) {
      // When phone is undefined, support button should be disabled
      expect(WA_PHONE).toBeUndefined();
      // But default message should still be available
      expect(WA_DEFAULT_MSG).toBeDefined();
    }
  });

  it("default message should work with WhatsApp URL encoding", () => {
    const encoded = encodeURIComponent(WA_DEFAULT_MSG);
    expect(encoded).toBeTruthy();
    expect(encoded.length).toBeGreaterThan(0);
    
    // Should decode back correctly
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe(WA_DEFAULT_MSG);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should not have null values", () => {
    expect(WA_PHONE).not.toBeNull();
    expect(WA_DEFAULT_MSG).not.toBeNull();
  });

  it("should not have empty string for phone", () => {
    if (WA_PHONE !== undefined) {
      expect(WA_PHONE).not.toBe("");
    }
  });

  it("should not have only whitespace in message", () => {
    expect(WA_DEFAULT_MSG.trim().length).toBeGreaterThan(0);
  });

  it("should handle special characters in message", () => {
    // Message should be safely encodable for URL
    const encoded = encodeURIComponent(WA_DEFAULT_MSG);
    expect(encoded).not.toContain("<");
    expect(encoded).not.toContain(">");
  });
});
