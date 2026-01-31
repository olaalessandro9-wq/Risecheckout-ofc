/**
 * @file definitions.test.ts
 * @description Tests for Gateway Registry - Individual Definitions and Edge Cases
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { GATEWAY_REGISTRY } from "../../gateways/registry";

// ============================================================================
// GATEWAY_REGISTRY Content
// ============================================================================

describe("GATEWAY_REGISTRY Definitions", () => {
  it("should have all 4 required gateways", () => {
    expect(GATEWAY_REGISTRY.asaas).toBeDefined();
    expect(GATEWAY_REGISTRY.mercadopago).toBeDefined();
    expect(GATEWAY_REGISTRY.pushinpay).toBeDefined();
    expect(GATEWAY_REGISTRY.stripe).toBeDefined();
  });

  it("all gateways should have required fields", () => {
    Object.values(GATEWAY_REGISTRY).forEach((gateway) => {
      expect(gateway).toHaveProperty("id");
      expect(gateway).toHaveProperty("integrationType");
      expect(gateway).toHaveProperty("name");
      expect(gateway).toHaveProperty("description");
      expect(gateway).toHaveProperty("icon");
      expect(gateway).toHaveProperty("iconColor");
      expect(gateway).toHaveProperty("status");
      expect(gateway).toHaveProperty("capabilities");
      expect(gateway).toHaveProperty("authType");
      expect(gateway).toHaveProperty("hasEnvironmentToggle");
      expect(gateway).toHaveProperty("fees");
    });
  });
});

// ============================================================================
// Edge Cases and Constraints
// ============================================================================

describe("Edge Cases and Constraints", () => {
  it("should have valid icon colors (hex format)", () => {
    Object.values(GATEWAY_REGISTRY).forEach((gateway) => {
      expect(gateway.iconColor).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it("should have consistent naming conventions", () => {
    Object.entries(GATEWAY_REGISTRY).forEach(([key, gateway]) => {
      expect(key).toBe(gateway.id);
      expect(key).toMatch(/^[a-z]+$/); // lowercase only
    });
  });

  it("should have fees defined for all gateways", () => {
    Object.values(GATEWAY_REGISTRY).forEach((gateway) => {
      expect(gateway.fees).toBeDefined();
      expect(typeof gateway.fees).toBe("object");
    });
  });
});
