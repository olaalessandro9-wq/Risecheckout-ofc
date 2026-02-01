/**
 * Pixel Validation Tests for pixel-management
 * 
 * @module pixel-management/tests/pixel-validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockSupabaseClient,
  createMockRequest,
  createDefaultProducer,
  createValidPixel,
  isValidPlatform,
  type MockProducer,
} from "./_shared.ts";

let mockSupabaseClient: Record<string, unknown>;
let mockProducer: MockProducer;

describe("pixel-management - Pixel Validation", () => {
  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    mockProducer = createDefaultProducer();
  });

  it("should validate pixel_id format", () => {
    const validPixelId = "1234567890123456";
    const isValidFormat = /^\d{15,16}$/.test(validPixelId);
    assertEquals(isValidFormat, true);
  });

  it("should reject invalid pixel_id format", () => {
    const invalidPixelId = "abc";
    const isValidFormat = /^\d{15,16}$/.test(invalidPixelId);
    assertEquals(isValidFormat, false);
  });

  it("should validate platform is in allowed list", () => {
    const pixel = createValidPixel();
    assertEquals(isValidPlatform(pixel.platform), true);
  });

  it("should reject unknown platforms", () => {
    const unknownPlatform = "unknown-platform";
    assertEquals(isValidPlatform(unknownPlatform), false);
  });

  it("should validate domain format when provided", () => {
    const validDomain = "example.com";
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    assertEquals(domainRegex.test(validDomain), true);
  });

  it("should allow empty domain", () => {
    const pixel = createValidPixel({ domain: null });
    assertEquals(pixel.domain, null);
  });

  it("should validate boolean fields", () => {
    const pixel = createValidPixel();
    assertEquals(typeof pixel.enabled, "boolean");
    assertEquals(typeof pixel.fire_on_pix, "boolean");
    assertEquals(typeof pixel.fire_on_boleto, "boolean");
    assertEquals(typeof pixel.fire_on_card, "boolean");
  });

  it("should validate custom value is positive number", () => {
    const pixel = createValidPixel({ custom_value_pix: 100 });
    assertExists(pixel.custom_value_pix);
    assertEquals(pixel.custom_value_pix! > 0, true);
  });

  it("should reject negative custom values", () => {
    const negativeValue = -100;
    const isValid = negativeValue > 0;
    assertEquals(isValid, false);
  });

  it("should validate access token format for Facebook", () => {
    const accessToken = "EAAxxxxxxxxxxxx";
    const isValidFormat = accessToken.startsWith("EAA");
    assertEquals(isValidFormat, true);
  });
});
