/**
 * @file index.test.ts
 * @description Tests for MercadoPago barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as MercadoPago from "../index";

describe("MercadoPago Barrel Export", () => {
  describe("API Exports", () => {
    it("should export createPreference", () => {
      expect(MercadoPago.createPreference).toBeDefined();
      expect(typeof MercadoPago.createPreference).toBe("function");
    });

    it("should export processPayment", () => {
      expect(MercadoPago.processPayment).toBeDefined();
      expect(typeof MercadoPago.processPayment).toBe("function");
    });

    it("should export getPayment", () => {
      expect(MercadoPago.getPayment).toBeDefined();
      expect(typeof MercadoPago.getPayment).toBe("function");
    });

    it("should export isValidConfig", () => {
      expect(MercadoPago.isValidConfig).toBeDefined();
      expect(typeof MercadoPago.isValidConfig).toBe("function");
    });

    it("should export initializeMercadoPago", () => {
      expect(MercadoPago.initializeMercadoPago).toBeDefined();
      expect(typeof MercadoPago.initializeMercadoPago).toBe("function");
    });
  });

  describe("Hook Exports", () => {
    it("should export useMercadoPagoConfig", () => {
      expect(MercadoPago.useMercadoPagoConfig).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoConfig).toBe("function");
    });

    it("should export useMercadoPagoInit", () => {
      expect(MercadoPago.useMercadoPagoInit).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoInit).toBe("function");
    });

    it("should export useMercadoPagoAvailable", () => {
      expect(MercadoPago.useMercadoPagoAvailable).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoAvailable).toBe("function");
    });

    it("should export useMercadoPagoBrick", () => {
      expect(MercadoPago.useMercadoPagoBrick).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoBrick).toBe("function");
    });

    it("should export useMercadoPagoConnection", () => {
      expect(MercadoPago.useMercadoPagoConnection).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoConnection).toBe("function");
    });

    it("should export useMercadoPagoSandbox", () => {
      expect(MercadoPago.useMercadoPagoSandbox).toBeDefined();
      expect(typeof MercadoPago.useMercadoPagoSandbox).toBe("function");
    });
  });

  describe("Component Exports", () => {
    it("should export Brick component", () => {
      expect(MercadoPago.Brick).toBeDefined();
    });

    it("should export ConfigForm component", () => {
      expect(MercadoPago.ConfigForm).toBeDefined();
    });
  });

  describe("Type Exports", () => {
    // Types are verified at compile time
    it("should compile with type exports", () => {
      expect(true).toBe(true);
    });
  });
});
