/**
 * @file gateways-index.test.ts
 * @description Tests for Gateway Registry Module Exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as GatewayModule from "../gateways/index";

// ============================================================================
// Module Exports
// ============================================================================

describe("Gateway Module Exports", () => {
  it("should export GATEWAY_REGISTRY", () => {
    expect(GatewayModule.GATEWAY_REGISTRY).toBeDefined();
  });

  it("should export GATEWAY_ORDER", () => {
    expect(GatewayModule.GATEWAY_ORDER).toBeDefined();
  });

  it("should export INTEGRATION_TYPE_MAP", () => {
    expect(GatewayModule.INTEGRATION_TYPE_MAP).toBeDefined();
  });

  it("should export GATEWAY_ID_MAP", () => {
    expect(GatewayModule.GATEWAY_ID_MAP).toBeDefined();
  });

  it("should export helper functions", () => {
    expect(GatewayModule.getGatewayById).toBeDefined();
    expect(GatewayModule.getAllGateways).toBeDefined();
    expect(GatewayModule.getGatewaysByStatus).toBeDefined();
    expect(GatewayModule.getActiveGateways).toBeDefined();
    expect(GatewayModule.getGatewaysByPaymentMethod).toBeDefined();
    expect(GatewayModule.getActiveGatewaysByPaymentMethod).toBeDefined();
    expect(GatewayModule.getPixGateways).toBeDefined();
    expect(GatewayModule.getCreditCardGateways).toBeDefined();
    expect(GatewayModule.isValidGatewayId).toBeDefined();
    expect(GatewayModule.formatGatewayFees).toBeDefined();
    expect(GatewayModule.integrationTypeToGatewayId).toBeDefined();
    expect(GatewayModule.gatewayIdToIntegrationType).toBeDefined();
  });
});

// ============================================================================
// Function Availability
// ============================================================================

describe("Exported Functions", () => {
  it("getGatewayById should be callable", () => {
    const gateway = GatewayModule.getGatewayById('asaas');
    expect(gateway).toBeDefined();
    expect(gateway.id).toBe('asaas');
  });

  it("getAllGateways should be callable", () => {
    const gateways = GatewayModule.getAllGateways();
    expect(Array.isArray(gateways)).toBe(true);
    expect(gateways.length).toBeGreaterThan(0);
  });

  it("getActiveGateways should be callable", () => {
    const activeGateways = GatewayModule.getActiveGateways();
    expect(Array.isArray(activeGateways)).toBe(true);
  });

  it("isValidGatewayId should be callable", () => {
    expect(GatewayModule.isValidGatewayId('asaas')).toBe(true);
    expect(GatewayModule.isValidGatewayId('invalid')).toBe(false);
  });

  it("formatGatewayFees should be callable", () => {
    const formatted = GatewayModule.formatGatewayFees({ percentage: 2.5 });
    expect(typeof formatted).toBe("string");
  });
});

// ============================================================================
// Module Structure
// ============================================================================

describe("Module Structure", () => {
  it("should have consistent exports", () => {
    const exportedKeys = Object.keys(GatewayModule);
    expect(exportedKeys.length).toBeGreaterThan(10);
  });

  it("should export constants as objects", () => {
    expect(typeof GatewayModule.GATEWAY_REGISTRY).toBe("object");
    expect(Array.isArray(GatewayModule.GATEWAY_ORDER)).toBe(true);
    expect(typeof GatewayModule.INTEGRATION_TYPE_MAP).toBe("object");
    expect(typeof GatewayModule.GATEWAY_ID_MAP).toBe("object");
  });

  it("should export functions", () => {
    expect(typeof GatewayModule.getGatewayById).toBe("function");
    expect(typeof GatewayModule.getAllGateways).toBe("function");
    expect(typeof GatewayModule.isValidGatewayId).toBe("function");
  });
});
