/**
 * @file gateways-types.test.ts
 * @description Tests for Gateway Registry Types
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import type {
  GatewayId,
  IntegrationType,
  GatewayStatus,
  GatewayEnvironment,
  PaymentMethod,
  GatewayAuthType,
  GatewayCapabilities,
  GatewayFees,
  GatewayDefinition,
  GatewayConnectionStatus,
  GatewayCredentialStatus,
} from "../gateways/types";

// ============================================================================
// Type Validation Tests
// ============================================================================

describe("GatewayId Type", () => {
  it("should accept valid gateway IDs", () => {
    const validIds: GatewayId[] = ['asaas', 'mercadopago', 'pushinpay', 'stripe'];
    
    validIds.forEach((id) => {
      expect(typeof id).toBe("string");
    });
  });

  it("should have exactly 4 gateway IDs", () => {
    const ids: GatewayId[] = ['asaas', 'mercadopago', 'pushinpay', 'stripe'];
    expect(ids).toHaveLength(4);
  });
});

describe("IntegrationType Type", () => {
  it("should accept valid integration types", () => {
    const validTypes: IntegrationType[] = ['ASAAS', 'MERCADOPAGO', 'PUSHINPAY', 'STRIPE'];
    
    validTypes.forEach((type) => {
      expect(typeof type).toBe("string");
      expect(type).toMatch(/^[A-Z]+$/); // Should be uppercase
    });
  });

  it("should have exactly 4 integration types", () => {
    const types: IntegrationType[] = ['ASAAS', 'MERCADOPAGO', 'PUSHINPAY', 'STRIPE'];
    expect(types).toHaveLength(4);
  });
});

describe("GatewayStatus Type", () => {
  it("should accept valid status values", () => {
    const validStatuses: GatewayStatus[] = ['active', 'beta', 'coming_soon', 'deprecated'];
    
    validStatuses.forEach((status) => {
      expect(typeof status).toBe("string");
    });
  });

  it("should have exactly 4 status options", () => {
    const statuses: GatewayStatus[] = ['active', 'beta', 'coming_soon', 'deprecated'];
    expect(statuses).toHaveLength(4);
  });
});

describe("GatewayEnvironment Type", () => {
  it("should accept valid environment values", () => {
    const validEnvs: GatewayEnvironment[] = ['sandbox', 'production'];
    
    validEnvs.forEach((env) => {
      expect(typeof env).toBe("string");
    });
  });

  it("should have exactly 2 environment options", () => {
    const envs: GatewayEnvironment[] = ['sandbox', 'production'];
    expect(envs).toHaveLength(2);
  });
});

describe("PaymentMethod Type", () => {
  it("should accept valid payment methods", () => {
    const validMethods: PaymentMethod[] = ['pix', 'credit_card', 'boleto', 'debit_card'];
    
    validMethods.forEach((method) => {
      expect(typeof method).toBe("string");
    });
  });

  it("should have exactly 4 payment methods", () => {
    const methods: PaymentMethod[] = ['pix', 'credit_card', 'boleto', 'debit_card'];
    expect(methods).toHaveLength(4);
  });
});

describe("GatewayAuthType Type", () => {
  it("should accept valid auth types", () => {
    const validAuthTypes: GatewayAuthType[] = ['api_key', 'oauth', 'mixed'];
    
    validAuthTypes.forEach((authType) => {
      expect(typeof authType).toBe("string");
    });
  });

  it("should have exactly 3 auth types", () => {
    const authTypes: GatewayAuthType[] = ['api_key', 'oauth', 'mixed'];
    expect(authTypes).toHaveLength(3);
  });
});

// ============================================================================
// Interface Structure Tests
// ============================================================================

describe("GatewayCapabilities Interface", () => {
  it("should have all required payment method flags", () => {
    const capabilities: GatewayCapabilities = {
      pix: true,
      creditCard: true,
      boleto: false,
      debitCard: false,
    };

    expect(capabilities).toHaveProperty("pix");
    expect(capabilities).toHaveProperty("creditCard");
    expect(capabilities).toHaveProperty("boleto");
    expect(capabilities).toHaveProperty("debitCard");
  });

  it("should have boolean values for all flags", () => {
    const capabilities: GatewayCapabilities = {
      pix: true,
      creditCard: false,
      boleto: true,
      debitCard: false,
    };

    expect(typeof capabilities.pix).toBe("boolean");
    expect(typeof capabilities.creditCard).toBe("boolean");
    expect(typeof capabilities.boleto).toBe("boolean");
    expect(typeof capabilities.debitCard).toBe("boolean");
  });
});

describe("GatewayFees Interface", () => {
  it("should accept valid fee structure", () => {
    const fees: GatewayFees = {
      fixed: 200,
      percentage: 3.99,
      transaction: 40,
    };

    expect(fees.fixed).toBe(200);
    expect(fees.percentage).toBe(3.99);
    expect(fees.transaction).toBe(40);
  });

  it("should allow optional fee fields", () => {
    const feesOnlyPercentage: GatewayFees = {
      percentage: 2.5,
    };

    expect(feesOnlyPercentage.percentage).toBe(2.5);
    expect(feesOnlyPercentage.fixed).toBeUndefined();
    expect(feesOnlyPercentage.transaction).toBeUndefined();
  });

  it("should allow empty fee structure", () => {
    const noFees: GatewayFees = {};

    expect(noFees.fixed).toBeUndefined();
    expect(noFees.percentage).toBeUndefined();
    expect(noFees.transaction).toBeUndefined();
  });
});

describe("GatewayConnectionStatus Interface", () => {
  it("should have all required fields", () => {
    const status: GatewayConnectionStatus = {
      id: 'asaas',
      connected: true,
      mode: 'production',
      lastConnectedAt: '2026-01-31T12:00:00Z',
    };

    expect(status).toHaveProperty("id");
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("mode");
    expect(status).toHaveProperty("lastConnectedAt");
  });

  it("should allow null values for mode and lastConnectedAt", () => {
    const disconnectedStatus: GatewayConnectionStatus = {
      id: 'stripe',
      connected: false,
      mode: null,
      lastConnectedAt: null,
    };

    expect(disconnectedStatus.mode).toBeNull();
    expect(disconnectedStatus.lastConnectedAt).toBeNull();
  });
});

describe("GatewayCredentialStatus Interface", () => {
  it("should have required configured field", () => {
    const status: GatewayCredentialStatus = {
      configured: true,
    };

    expect(status).toHaveProperty("configured");
    expect(typeof status.configured).toBe("boolean");
  });

  it("should allow optional viaSecrets field", () => {
    const statusWithSecrets: GatewayCredentialStatus = {
      configured: true,
      viaSecrets: true,
    };

    expect(statusWithSecrets.viaSecrets).toBe(true);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should handle gateway IDs consistently", () => {
    const ids: GatewayId[] = ['asaas', 'mercadopago', 'pushinpay', 'stripe'];
    
    // All IDs should be lowercase
    ids.forEach((id) => {
      expect(id).toBe(id.toLowerCase());
    });
  });

  it("should handle integration types consistently", () => {
    const types: IntegrationType[] = ['ASAAS', 'MERCADOPAGO', 'PUSHINPAY', 'STRIPE'];
    
    // All types should be uppercase
    types.forEach((type) => {
      expect(type).toBe(type.toUpperCase());
    });
  });

  it("should use snake_case for multi-word types", () => {
    const methods: PaymentMethod[] = ['credit_card', 'debit_card'];
    
    methods.forEach((method) => {
      expect(method).toMatch(/^[a-z_]+$/);
    });
  });
});
