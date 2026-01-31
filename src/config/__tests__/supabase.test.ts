/**
 * @file supabase.test.ts
 * @description Tests for Supabase configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { API_GATEWAY_URL, SUPABASE_URL } from "../supabase";

// ============================================================================
// API_GATEWAY_URL
// ============================================================================

describe("API_GATEWAY_URL", () => {
  it("should be defined", () => {
    expect(API_GATEWAY_URL).toBeDefined();
  });

  it("should be a valid HTTPS URL", () => {
    expect(API_GATEWAY_URL).toMatch(/^https:\/\//);
  });

  it("should point to api.risecheckout.com", () => {
    expect(API_GATEWAY_URL).toBe("https://api.risecheckout.com");
  });

  it("should not have trailing slash", () => {
    expect(API_GATEWAY_URL).not.toMatch(/\/$/);
  });
});

// ============================================================================
// SUPABASE_URL
// ============================================================================

describe("SUPABASE_URL", () => {
  it("should be defined", () => {
    expect(SUPABASE_URL).toBeDefined();
  });

  it("should be an alias for API_GATEWAY_URL", () => {
    expect(SUPABASE_URL).toBe(API_GATEWAY_URL);
  });

  it("should be a valid HTTPS URL", () => {
    expect(SUPABASE_URL).toMatch(/^https:\/\//);
  });

  it("should point to the same domain as API_GATEWAY_URL", () => {
    const apiDomain = new URL(API_GATEWAY_URL).hostname;
    const supabaseDomain = new URL(SUPABASE_URL).hostname;
    expect(supabaseDomain).toBe(apiDomain);
  });
});

// ============================================================================
// ARCHITECTURE VALIDATION
// ============================================================================

describe("Architecture Validation", () => {
  it("should follow Zero Secrets in Frontend principle", () => {
    // Both constants should only contain URLs, no API keys
    expect(API_GATEWAY_URL).not.toMatch(/key|token|secret/i);
    expect(SUPABASE_URL).not.toMatch(/key|token|secret/i);
  });

  it("should use secure protocol (HTTPS)", () => {
    expect(API_GATEWAY_URL).toMatch(/^https:/);
    expect(SUPABASE_URL).toMatch(/^https:/);
  });

  it("should not expose internal Supabase project URL", () => {
    // Should not contain supabase.co domain
    expect(API_GATEWAY_URL).not.toMatch(/supabase\.co/);
    expect(SUPABASE_URL).not.toMatch(/supabase\.co/);
  });
});
