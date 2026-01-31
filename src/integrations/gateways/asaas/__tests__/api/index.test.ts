/**
 * @file index.test.ts
 * @description Tests for Asaas API barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as AsaasAPI from "../../api/index";

describe("Asaas API Barrel Export", () => {
  describe("Validation Exports", () => {
    it("should export validateAsaasCredentials", () => {
      expect(AsaasAPI.validateAsaasCredentials).toBeDefined();
      expect(typeof AsaasAPI.validateAsaasCredentials).toBe("function");
    });
  });

  describe("Payment Exports", () => {
    it("should export createAsaasPixPayment", () => {
      expect(AsaasAPI.createAsaasPixPayment).toBeDefined();
      expect(typeof AsaasAPI.createAsaasPixPayment).toBe("function");
    });

    it("should export createAsaasCreditCardPayment", () => {
      expect(AsaasAPI.createAsaasCreditCardPayment).toBeDefined();
      expect(typeof AsaasAPI.createAsaasCreditCardPayment).toBe("function");
    });
  });

  describe("Settings Exports", () => {
    it("should export getAsaasSettings", () => {
      expect(AsaasAPI.getAsaasSettings).toBeDefined();
      expect(typeof AsaasAPI.getAsaasSettings).toBe("function");
    });

    it("should export saveAsaasSettings", () => {
      expect(AsaasAPI.saveAsaasSettings).toBeDefined();
      expect(typeof AsaasAPI.saveAsaasSettings).toBe("function");
    });

    it("should export disconnectAsaas", () => {
      expect(AsaasAPI.disconnectAsaas).toBeDefined();
      expect(typeof AsaasAPI.disconnectAsaas).toBe("function");
    });

    it("should export isAsaasConnected", () => {
      expect(AsaasAPI.isAsaasConnected).toBeDefined();
      expect(typeof AsaasAPI.isAsaasConnected).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export at least 6 functions", () => {
      const exportCount = Object.keys(AsaasAPI).length;
      expect(exportCount).toBeGreaterThanOrEqual(6);
    });
  });
});
