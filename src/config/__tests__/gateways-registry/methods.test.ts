/**
 * @file methods.test.ts
 * @description Tests for Gateway Registry - Search and Filter Methods
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import {
  getGatewayById,
  getAllGateways,
  getGatewaysByStatus,
  getActiveGateways,
  getGatewaysByPaymentMethod,
  getActiveGatewaysByPaymentMethod,
  getPixGateways,
  getCreditCardGateways,
  formatGatewayFees,
} from "../../gateways/registry";

// ============================================================================
// Search and Retrieval
// ============================================================================

describe("Gateway Retrieval", () => {
  it("getGatewayById should return correct definitions", () => {
    expect(getGatewayById('asaas').name).toBe('Asaas');
    expect(getGatewayById('stripe').name).toBe('Stripe');
  });

  it("getAllGateways should return all in order", () => {
    const gateways = getAllGateways();
    expect(gateways).toHaveLength(4);
    expect(gateways[0].id).toBe('asaas');
  });
});

// ============================================================================
// Status Filtering
// ============================================================================

describe("Status Filtering", () => {
  it("getGatewaysByStatus should filter correctly", () => {
    const active = getGatewaysByStatus('active');
    active.forEach(g => expect(g.status).toBe('active'));
    
    const comingSoon = getGatewaysByStatus('coming_soon');
    comingSoon.forEach(g => expect(g.status).toBe('coming_soon'));
  });

  it("getActiveGateways should return only active", () => {
    const active = getActiveGateways();
    expect(active.length).toBeGreaterThanOrEqual(3);
    active.forEach(g => expect(g.status).toBe('active'));
  });
});

// ============================================================================
// Payment Method Filtering
// ============================================================================

describe("Payment Method Filtering", () => {
  it("getGatewaysByPaymentMethod should filter by capability", () => {
    const pix = getGatewaysByPaymentMethod('pix');
    pix.forEach(g => expect(g.capabilities.pix).toBe(true));
  });

  it("getActiveGatewaysByPaymentMethod should filter active only", () => {
    const activePix = getActiveGatewaysByPaymentMethod('pix');
    activePix.forEach(g => {
      expect(g.status).toBe('active');
      expect(g.capabilities.pix).toBe(true);
    });
  });

  it("getPixGateways should return pix-capable gateways", () => {
    const pix = getPixGateways();
    pix.forEach(g => expect(g.capabilities.pix).toBe(true));
  });

  it("getCreditCardGateways should return cc-capable gateways", () => {
    const cc = getCreditCardGateways();
    cc.forEach(g => expect(g.capabilities.creditCard).toBe(true));
  });
});

// ============================================================================
// Utility Methods
// ============================================================================

describe("Utility Methods", () => {
  it("formatGatewayFees should format fees correctly", () => {
    expect(formatGatewayFees({ fixed: 200 })).toContain("R$ 2.00");
    expect(formatGatewayFees({ percentage: 3.5 })).toContain("3.50%");
    expect(formatGatewayFees({})).toBe("Sem taxas");
  });
});
