/**
 * @file core.test.ts
 * @description Tests for Gateway Registry - Core Constants and Mappings
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import {
  GATEWAY_ORDER,
  INTEGRATION_TYPE_MAP,
  GATEWAY_ID_MAP,
  isValidGatewayId,
  integrationTypeToGatewayId,
  gatewayIdToIntegrationType,
} from "../../gateways/registry";
import type { IntegrationType } from "../../gateways/types";

// ============================================================================
// GATEWAY_ORDER
// ============================================================================

describe("GATEWAY_ORDER", () => {
  it("should be defined", () => {
    expect(GATEWAY_ORDER).toBeDefined();
  });

  it("should have exactly 4 gateways", () => {
    expect(GATEWAY_ORDER).toHaveLength(4);
  });

  it("should contain all gateway IDs", () => {
    expect(GATEWAY_ORDER).toContain('asaas');
    expect(GATEWAY_ORDER).toContain('mercadopago');
    expect(GATEWAY_ORDER).toContain('pushinpay');
    expect(GATEWAY_ORDER).toContain('stripe');
  });

  it("should have consistent order", () => {
    expect(GATEWAY_ORDER[0]).toBe('asaas');
    expect(GATEWAY_ORDER[1]).toBe('pushinpay');
    expect(GATEWAY_ORDER[2]).toBe('mercadopago');
    expect(GATEWAY_ORDER[3]).toBe('stripe');
  });
});

// ============================================================================
// INTEGRATION_TYPE_MAP
// ============================================================================

describe("INTEGRATION_TYPE_MAP", () => {
  it("should be defined", () => {
    expect(INTEGRATION_TYPE_MAP).toBeDefined();
  });

  it("should map all gateway IDs to integration types", () => {
    expect(INTEGRATION_TYPE_MAP.asaas).toBe('ASAAS');
    expect(INTEGRATION_TYPE_MAP.mercadopago).toBe('MERCADOPAGO');
    expect(INTEGRATION_TYPE_MAP.pushinpay).toBe('PUSHINPAY');
    expect(INTEGRATION_TYPE_MAP.stripe).toBe('STRIPE');
  });

  it("should have exactly 4 mappings", () => {
    expect(Object.keys(INTEGRATION_TYPE_MAP)).toHaveLength(4);
  });
});

// ============================================================================
// GATEWAY_ID_MAP
// ============================================================================

describe("GATEWAY_ID_MAP", () => {
  it("should be defined", () => {
    expect(GATEWAY_ID_MAP).toBeDefined();
  });

  it("should map all integration types to gateway IDs", () => {
    expect(GATEWAY_ID_MAP.ASAAS).toBe('asaas');
    expect(GATEWAY_ID_MAP.MERCADOPAGO).toBe('mercadopago');
    expect(GATEWAY_ID_MAP.PUSHINPAY).toBe('pushinpay');
    expect(GATEWAY_ID_MAP.STRIPE).toBe('stripe');
  });

  it("should be the inverse of INTEGRATION_TYPE_MAP", () => {
    Object.entries(INTEGRATION_TYPE_MAP).forEach(([gatewayId, integrationType]) => {
      expect(GATEWAY_ID_MAP[integrationType as IntegrationType]).toBe(gatewayId);
    });
  });
});

// ============================================================================
// ID and Type Conversion Helpers
// ============================================================================

describe("Conversion Helpers", () => {
  it("isValidGatewayId should validate IDs", () => {
    expect(isValidGatewayId('asaas')).toBe(true);
    expect(isValidGatewayId('invalid')).toBe(false);
  });

  it("integrationTypeToGatewayId should convert correctly", () => {
    expect(integrationTypeToGatewayId('ASAAS')).toBe('asaas');
    expect(integrationTypeToGatewayId('STRIPE')).toBe('stripe');
  });

  it("gatewayIdToIntegrationType should convert correctly", () => {
    expect(gatewayIdToIntegrationType('asaas')).toBe('ASAAS');
    expect(gatewayIdToIntegrationType('stripe')).toBe('STRIPE');
  });
});
