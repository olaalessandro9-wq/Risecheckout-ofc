/**
 * @file api.test.ts
 * @description Tests for MercadoPago API barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
    publicCall: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("MercadoPago API", () => {
  describe("Exports", () => {
    it("should export createPreference function", async () => {
      const { createPreference } = await import("../api/payment-api");
      expect(typeof createPreference).toBe("function");
    });

    it("should export processPayment function", async () => {
      const { processPayment } = await import("../api/payment-api");
      expect(typeof processPayment).toBe("function");
    });

    it("should export getPayment function", async () => {
      const { getPayment } = await import("../api/payment-api");
      expect(typeof getPayment).toBe("function");
    });

    it("should export isValidConfig function", async () => {
      const { isValidConfig } = await import("../api/sdk-utils");
      expect(typeof isValidConfig).toBe("function");
    });

    it("should export initializeMercadoPago function", async () => {
      const { initializeMercadoPago } = await import("../api/sdk-utils");
      expect(typeof initializeMercadoPago).toBe("function");
    });
  });
});
