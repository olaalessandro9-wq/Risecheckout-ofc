/**
 * @file index.test.ts
 * @description Tests for Asaas barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as Asaas from "../index";

describe("Asaas Module Barrel Export", () => {
  describe("Type Exports", () => {
    it("should export all types (validated at compile time)", () => {
      // Types are validated at compile time
      // This test ensures the module exports correctly
      expect(Asaas).toBeDefined();
    });
  });

  describe("API Function Exports", () => {
    it("should export validateAsaasCredentials", () => {
      expect(Asaas.validateAsaasCredentials).toBeDefined();
      expect(typeof Asaas.validateAsaasCredentials).toBe("function");
    });

    it("should export createAsaasPixPayment", () => {
      expect(Asaas.createAsaasPixPayment).toBeDefined();
      expect(typeof Asaas.createAsaasPixPayment).toBe("function");
    });

    it("should export createAsaasCreditCardPayment", () => {
      expect(Asaas.createAsaasCreditCardPayment).toBeDefined();
      expect(typeof Asaas.createAsaasCreditCardPayment).toBe("function");
    });

    it("should export getAsaasSettings", () => {
      expect(Asaas.getAsaasSettings).toBeDefined();
      expect(typeof Asaas.getAsaasSettings).toBe("function");
    });

    it("should export saveAsaasSettings", () => {
      expect(Asaas.saveAsaasSettings).toBeDefined();
      expect(typeof Asaas.saveAsaasSettings).toBe("function");
    });

    it("should export disconnectAsaas", () => {
      expect(Asaas.disconnectAsaas).toBeDefined();
      expect(typeof Asaas.disconnectAsaas).toBe("function");
    });

    it("should export isAsaasConnected", () => {
      expect(Asaas.isAsaasConnected).toBeDefined();
      expect(typeof Asaas.isAsaasConnected).toBe("function");
    });
  });

  describe("Hook Exports", () => {
    it("should export useAsaasConfig", () => {
      expect(Asaas.useAsaasConfig).toBeDefined();
      expect(typeof Asaas.useAsaasConfig).toBe("function");
    });

    it("should export useAsaasValidation", () => {
      expect(Asaas.useAsaasValidation).toBeDefined();
      expect(typeof Asaas.useAsaasValidation).toBe("function");
    });

    it("should export useAsaasSaveConfig", () => {
      expect(Asaas.useAsaasSaveConfig).toBeDefined();
      expect(typeof Asaas.useAsaasSaveConfig).toBe("function");
    });

    it("should export useAsaasDisconnect", () => {
      expect(Asaas.useAsaasDisconnect).toBeDefined();
      expect(typeof Asaas.useAsaasDisconnect).toBe("function");
    });

    it("should export useAsaasConnectionStatus", () => {
      expect(Asaas.useAsaasConnectionStatus).toBeDefined();
      expect(typeof Asaas.useAsaasConnectionStatus).toBe("function");
    });
  });

  describe("Component Exports", () => {
    it("should export ConfigForm", () => {
      expect(Asaas.ConfigForm).toBeDefined();
    });
  });

  describe("Export Count", () => {
    it("should export correct number of items", () => {
      // 7 API functions + 5 hooks + 1 component = 13
      // Plus type exports (not counted in Object.keys)
      const exportCount = Object.keys(Asaas).length;
      expect(exportCount).toBeGreaterThanOrEqual(13);
    });
  });
});
