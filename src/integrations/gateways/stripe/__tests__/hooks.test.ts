/**
 * @file hooks.test.ts
 * @description Tests for Stripe React hooks exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "user-123" },
    isLoading: false,
  })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../api", () => ({
  getStripeConnectionStatus: vi.fn(),
  startStripeConnect: vi.fn(),
  disconnectStripe: vi.fn(),
  getStripeConfig: vi.fn(),
}));

describe("Stripe Hooks", () => {
  describe("Exports", () => {
    it("should export useStripeConfig", async () => {
      const { useStripeConfig } = await import("../hooks");
      expect(typeof useStripeConfig).toBe("function");
    });

    it("should export useStripeConnectionStatus", async () => {
      const { useStripeConnectionStatus } = await import("../hooks");
      expect(typeof useStripeConnectionStatus).toBe("function");
    });

    it("should export useStripeConnect", async () => {
      const { useStripeConnect } = await import("../hooks");
      expect(typeof useStripeConnect).toBe("function");
    });

    it("should export useStripeDisconnect", async () => {
      const { useStripeDisconnect } = await import("../hooks");
      expect(typeof useStripeDisconnect).toBe("function");
    });

    it("should export useStripeOAuthCallback", async () => {
      const { useStripeOAuthCallback } = await import("../hooks");
      expect(typeof useStripeOAuthCallback).toBe("function");
    });
  });
});
