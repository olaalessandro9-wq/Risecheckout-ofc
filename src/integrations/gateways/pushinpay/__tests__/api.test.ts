/**
 * @file api.test.ts
 * @description Tests for PushinPay API exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi } from "vitest";

// Mock API client
vi.mock("@/lib/api/client", () => ({
  api: {
    call: vi.fn(),
    publicCall: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("PushinPay API", () => {
  describe("Exports", () => {
    it("should export fetchPushinPayAccountInfo", async () => {
      const { fetchPushinPayAccountInfo } = await import("../api");
      expect(typeof fetchPushinPayAccountInfo).toBe("function");
    });

    it("should export savePushinPaySettings", async () => {
      const { savePushinPaySettings } = await import("../api");
      expect(typeof savePushinPaySettings).toBe("function");
    });

    it("should export getPushinPaySettings", async () => {
      const { getPushinPaySettings } = await import("../api");
      expect(typeof getPushinPaySettings).toBe("function");
    });

    it("should export createPixCharge", async () => {
      const { createPixCharge } = await import("../api");
      expect(typeof createPixCharge).toBe("function");
    });

    it("should export getPixStatus", async () => {
      const { getPixStatus } = await import("../api");
      expect(typeof getPixStatus).toBe("function");
    });

    it("should export testPushinPayConnection", async () => {
      const { testPushinPayConnection } = await import("../api");
      expect(typeof testPushinPayConnection).toBe("function");
    });

    it("should export getPushinPayStats", async () => {
      const { getPushinPayStats } = await import("../api");
      expect(typeof getPushinPayStats).toBe("function");
    });
  });
});
