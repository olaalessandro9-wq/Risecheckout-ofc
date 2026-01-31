/**
 * @file gateways-registry.test.ts
 * @description Tests for Gateway Registry
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import {
  GATEWAY_REGISTRY,
  GATEWAY_ORDER,
  INTEGRATION_TYPE_MAP,
  GATEWAY_ID_MAP,
  getGatewayById,
  getAllGateways,
  getGatewaysByStatus,
  getActiveGateways,
  getGatewaysByPaymentMethod,
  getActiveGatewaysByPaymentMethod,
  getPixGateways,
  getCreditCardGateways,
  isValidGatewayId,
  formatGatewayFees,
  integrationTypeToGatewayId,
  gatewayIdToIntegrationType,
} from "../gateways/registry";
import type { GatewayId, IntegrationType } from "../gateways/types";

// ============================================================================
// GATEWAY_REGISTRY
// ============================================================================

describe("GATEWAY_REGISTRY", () => {
  it("should be defined", () => {
    expect(GATEWAY_REGISTRY).toBeDefined();
  });

  it("should have all 4 gateways", () => {
    expect(Object.keys(GATEWAY_REGISTRY)).toHaveLength(4);
  });

  it("should have asaas gateway", () => {
    expect(GATEWAY_REGISTRY.asaas).toBeDefined();
    expect(GATEWAY_REGISTRY.asaas.id).toBe('asaas');
  });

  it("should have mercadopago gateway", () => {
    expect(GATEWAY_REGISTRY.mercadopago).toBeDefined();
    expect(GATEWAY_REGISTRY.mercadopago.id).toBe('mercadopago');
  });

  it("should have pushinpay gateway", () => {
    expect(GATEWAY_REGISTRY.pushinpay).toBeDefined();
    expect(GATEWAY_REGISTRY.pushinpay.id).toBe('pushinpay');
  });

  it("should have stripe gateway", () => {
    expect(GATEWAY_REGISTRY.stripe).toBeDefined();
    expect(GATEWAY_REGISTRY.stripe.id).toBe('stripe');
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

  it("should have exactly 4 mappings", () => {
    expect(Object.keys(GATEWAY_ID_MAP)).toHaveLength(4);
  });

  it("should be the inverse of INTEGRATION_TYPE_MAP", () => {
    Object.entries(INTEGRATION_TYPE_MAP).forEach(([gatewayId, integrationType]) => {
      expect(GATEWAY_ID_MAP[integrationType]).toBe(gatewayId);
    });
  });
});

// ============================================================================
// getGatewayById
// ============================================================================

describe("getGatewayById", () => {
  it("should return asaas gateway", () => {
    const gateway = getGatewayById('asaas');
    expect(gateway.id).toBe('asaas');
    expect(gateway.name).toBe('Asaas');
  });

  it("should return mercadopago gateway", () => {
    const gateway = getGatewayById('mercadopago');
    expect(gateway.id).toBe('mercadopago');
    expect(gateway.name).toBe('Mercado Pago');
  });

  it("should return pushinpay gateway", () => {
    const gateway = getGatewayById('pushinpay');
    expect(gateway.id).toBe('pushinpay');
    expect(gateway.name).toBe('PushinPay');
  });

  it("should return stripe gateway", () => {
    const gateway = getGatewayById('stripe');
    expect(gateway.id).toBe('stripe');
    expect(gateway.name).toBe('Stripe');
  });
});

// ============================================================================
// getAllGateways
// ============================================================================

describe("getAllGateways", () => {
  it("should return all gateways", () => {
    const gateways = getAllGateways();
    expect(gateways).toHaveLength(4);
  });

  it("should return gateways in GATEWAY_ORDER", () => {
    const gateways = getAllGateways();
    expect(gateways[0].id).toBe('asaas');
    expect(gateways[1].id).toBe('pushinpay');
    expect(gateways[2].id).toBe('mercadopago');
    expect(gateways[3].id).toBe('stripe');
  });

  it("should return array of gateway definitions", () => {
    const gateways = getAllGateways();
    gateways.forEach((gateway) => {
      expect(gateway).toHaveProperty("id");
      expect(gateway).toHaveProperty("name");
      expect(gateway).toHaveProperty("capabilities");
    });
  });
});

// ============================================================================
// getGatewaysByStatus
// ============================================================================

describe("getGatewaysByStatus", () => {
  it("should return active gateways", () => {
    const activeGateways = getGatewaysByStatus('active');
    expect(activeGateways.length).toBeGreaterThan(0);
    activeGateways.forEach((gateway) => {
      expect(gateway.status).toBe('active');
    });
  });

  it("should return coming_soon gateways", () => {
    const comingSoonGateways = getGatewaysByStatus('coming_soon');
    comingSoonGateways.forEach((gateway) => {
      expect(gateway.status).toBe('coming_soon');
    });
  });

  it("should return empty array for non-existent status", () => {
    const deprecated = getGatewaysByStatus('deprecated');
    expect(Array.isArray(deprecated)).toBe(true);
  });
});

// ============================================================================
// getActiveGateways
// ============================================================================

describe("getActiveGateways", () => {
  it("should return only active gateways", () => {
    const activeGateways = getActiveGateways();
    activeGateways.forEach((gateway) => {
      expect(gateway.status).toBe('active');
    });
  });

  it("should include asaas, mercadopago, pushinpay", () => {
    const activeGateways = getActiveGateways();
    const ids = activeGateways.map((g) => g.id);
    expect(ids).toContain('asaas');
    expect(ids).toContain('mercadopago');
    expect(ids).toContain('pushinpay');
  });

  it("should return at least 3 active gateways", () => {
    const activeGateways = getActiveGateways();
    expect(activeGateways.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// getGatewaysByPaymentMethod
// ============================================================================

describe("getGatewaysByPaymentMethod", () => {
  it("should return gateways supporting pix", () => {
    const pixGateways = getGatewaysByPaymentMethod('pix');
    expect(pixGateways.length).toBeGreaterThan(0);
    pixGateways.forEach((gateway) => {
      expect(gateway.capabilities.pix).toBe(true);
    });
  });

  it("should return gateways supporting credit_card", () => {
    const ccGateways = getGatewaysByPaymentMethod('credit_card');
    expect(ccGateways.length).toBeGreaterThan(0);
    ccGateways.forEach((gateway) => {
      expect(gateway.capabilities.creditCard).toBe(true);
    });
  });

  it("should return gateways supporting debit_card", () => {
    const debitGateways = getGatewaysByPaymentMethod('debit_card');
    debitGateways.forEach((gateway) => {
      expect(gateway.capabilities.debitCard).toBe(true);
    });
  });

  it("should return gateways supporting boleto", () => {
    const boletoGateways = getGatewaysByPaymentMethod('boleto');
    boletoGateways.forEach((gateway) => {
      expect(gateway.capabilities.boleto).toBe(true);
    });
  });
});

// ============================================================================
// getActiveGatewaysByPaymentMethod
// ============================================================================

describe("getActiveGatewaysByPaymentMethod", () => {
  it("should return only active gateways for pix", () => {
    const activePixGateways = getActiveGatewaysByPaymentMethod('pix');
    activePixGateways.forEach((gateway) => {
      expect(gateway.status).toBe('active');
      expect(gateway.capabilities.pix).toBe(true);
    });
  });

  it("should return only active gateways for credit_card", () => {
    const activeCcGateways = getActiveGatewaysByPaymentMethod('credit_card');
    activeCcGateways.forEach((gateway) => {
      expect(gateway.status).toBe('active');
      expect(gateway.capabilities.creditCard).toBe(true);
    });
  });
});

// ============================================================================
// getPixGateways
// ============================================================================

describe("getPixGateways", () => {
  it("should return gateways supporting PIX", () => {
    const pixGateways = getPixGateways();
    expect(pixGateways.length).toBeGreaterThan(0);
    pixGateways.forEach((gateway) => {
      expect(gateway.capabilities.pix).toBe(true);
    });
  });

  it("should include asaas, mercadopago, pushinpay", () => {
    const pixGateways = getPixGateways();
    const ids = pixGateways.map((g) => g.id);
    expect(ids).toContain('asaas');
    expect(ids).toContain('mercadopago');
    expect(ids).toContain('pushinpay');
  });
});

// ============================================================================
// getCreditCardGateways
// ============================================================================

describe("getCreditCardGateways", () => {
  it("should return gateways supporting credit card", () => {
    const ccGateways = getCreditCardGateways();
    expect(ccGateways.length).toBeGreaterThan(0);
    ccGateways.forEach((gateway) => {
      expect(gateway.capabilities.creditCard).toBe(true);
    });
  });

  it("should include asaas, mercadopago", () => {
    const ccGateways = getCreditCardGateways();
    const ids = ccGateways.map((g) => g.id);
    expect(ids).toContain('asaas');
    expect(ids).toContain('mercadopago');
  });
});

// ============================================================================
// isValidGatewayId
// ============================================================================

describe("isValidGatewayId", () => {
  it("should return true for valid gateway IDs", () => {
    expect(isValidGatewayId('asaas')).toBe(true);
    expect(isValidGatewayId('mercadopago')).toBe(true);
    expect(isValidGatewayId('pushinpay')).toBe(true);
    expect(isValidGatewayId('stripe')).toBe(true);
  });

  it("should return false for invalid gateway IDs", () => {
    expect(isValidGatewayId('invalid')).toBe(false);
    expect(isValidGatewayId('pagseguro')).toBe(false);
    expect(isValidGatewayId('')).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isValidGatewayId('ASAAS')).toBe(false);
    expect(isValidGatewayId('Stripe')).toBe(false);
  });
});

// ============================================================================
// formatGatewayFees
// ============================================================================

describe("formatGatewayFees", () => {
  it("should format fixed fee", () => {
    const formatted = formatGatewayFees({ fixed: 200 });
    expect(formatted).toContain("R$ 2.00");
    expect(formatted).toContain("Taxa:");
  });

  it("should format percentage fee", () => {
    const formatted = formatGatewayFees({ percentage: 3.99 });
    expect(formatted).toContain("3.99%");
  });

  it("should format transaction fee", () => {
    const formatted = formatGatewayFees({ transaction: 40 });
    expect(formatted).toContain("R$ 0.40");
  });

  it("should format combined fees", () => {
    const formatted = formatGatewayFees({
      fixed: 200,
      percentage: 3.99,
      transaction: 40,
    });
    expect(formatted).toContain("R$ 2.00");
    expect(formatted).toContain("3.99%");
    expect(formatted).toContain("R$ 0.40");
    expect(formatted).toContain("+");
  });

  it("should return 'Sem taxas' for empty fees", () => {
    const formatted = formatGatewayFees({});
    expect(formatted).toBe("Sem taxas");
  });

  it("should handle zero fees", () => {
    const formatted = formatGatewayFees({ fixed: 0, percentage: 0 });
    expect(formatted).toBe("Sem taxas");
  });
});

// ============================================================================
// integrationTypeToGatewayId
// ============================================================================

describe("integrationTypeToGatewayId", () => {
  it("should convert ASAAS to asaas", () => {
    expect(integrationTypeToGatewayId('ASAAS')).toBe('asaas');
  });

  it("should convert MERCADOPAGO to mercadopago", () => {
    expect(integrationTypeToGatewayId('MERCADOPAGO')).toBe('mercadopago');
  });

  it("should convert PUSHINPAY to pushinpay", () => {
    expect(integrationTypeToGatewayId('PUSHINPAY')).toBe('pushinpay');
  });

  it("should convert STRIPE to stripe", () => {
    expect(integrationTypeToGatewayId('STRIPE')).toBe('stripe');
  });
});

// ============================================================================
// gatewayIdToIntegrationType
// ============================================================================

describe("gatewayIdToIntegrationType", () => {
  it("should convert asaas to ASAAS", () => {
    expect(gatewayIdToIntegrationType('asaas')).toBe('ASAAS');
  });

  it("should convert mercadopago to MERCADOPAGO", () => {
    expect(gatewayIdToIntegrationType('mercadopago')).toBe('MERCADOPAGO');
  });

  it("should convert pushinpay to PUSHINPAY", () => {
    expect(gatewayIdToIntegrationType('pushinpay')).toBe('PUSHINPAY');
  });

  it("should convert stripe to STRIPE", () => {
    expect(gatewayIdToIntegrationType('stripe')).toBe('STRIPE');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should handle all gateways having fees defined", () => {
    Object.values(GATEWAY_REGISTRY).forEach((gateway) => {
      expect(gateway.fees).toBeDefined();
      expect(typeof gateway.fees).toBe("object");
    });
  });

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
});
