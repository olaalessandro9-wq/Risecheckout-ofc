/**
 * @file api.test.ts
 * @description Tests for Stripe API functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock API client
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
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

import { api } from "@/lib/api";
import {
  getStripeConnectionStatus,
  startStripeConnect,
  disconnectStripe,
  isStripeConnected,
  getStripeConfig,
} from "../api";

describe("Stripe API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStripeConnectionStatus", () => {
    it("should return connected status with account details", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          connected: true,
          account_id: "acct_xxx",
          email: "test@stripe.com",
          livemode: true,
          connected_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      });

      const result = await getStripeConnectionStatus();

      expect(result.connected).toBe(true);
      expect(result.account_id).toBe("acct_xxx");
      expect(result.email).toBe("test@stripe.com");
      expect(result.livemode).toBe(true);
    });

    it("should return disconnected status", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { connected: false },
        error: null,
      });

      const result = await getStripeConnectionStatus();

      expect(result.connected).toBe(false);
      expect(result.account_id).toBeNull();
    });

    it("should handle API error gracefully", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Service error" },
      });

      const result = await getStripeConnectionStatus();

      expect(result.connected).toBe(false);
    });

    it("should handle exception gracefully", async () => {
      vi.mocked(api.call).mockRejectedValueOnce(new Error("Network error"));

      const result = await getStripeConnectionStatus();

      expect(result.connected).toBe(false);
    });
  });

  describe("startStripeConnect", () => {
    it("should return OAuth URL on success", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          url: "https://connect.stripe.com/oauth/authorize?...",
        },
        error: null,
      });

      const result = await startStripeConnect();

      expect(result.success).toBe(true);
      expect(result.url).toContain("stripe.com");
    });

    it("should return error on failure", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: false, error: "User not authenticated" },
        error: null,
      });

      const result = await startStripeConnect();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });

      const result = await startStripeConnect();

      expect(result.success).toBe(false);
    });

    it("should handle exception", async () => {
      vi.mocked(api.call).mockRejectedValueOnce(new Error("Network error"));

      const result = await startStripeConnect();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro de conexão");
    });
  });

  describe("disconnectStripe", () => {
    it("should disconnect successfully", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const result = await disconnectStripe();

      expect(result.success).toBe(true);
    });

    it("should return error on failure", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { success: false, error: "Account not found" },
        error: null,
      });

      const result = await disconnectStripe();

      expect(result.success).toBe(false);
    });

    it("should handle API error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Server error" },
      });

      const result = await disconnectStripe();

      expect(result.success).toBe(false);
    });

    it("should handle exception", async () => {
      vi.mocked(api.call).mockRejectedValueOnce(new Error("Connection timeout"));

      const result = await disconnectStripe();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Erro de conexão");
    });
  });

  describe("isStripeConnected", () => {
    it("should return true when connected", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { connected: true, account_id: "acct_xxx" },
        error: null,
      });

      const result = await isStripeConnected();

      expect(result).toBe(true);
    });

    it("should return false when not connected", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { connected: false },
        error: null,
      });

      const result = await isStripeConnected();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Error" },
      });

      const result = await isStripeConnected();

      expect(result).toBe(false);
    });
  });

  describe("getStripeConfig", () => {
    it("should return config when connected", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          connected: true,
          account_id: "acct_xxx",
          email: "test@stripe.com",
          livemode: true,
          connected_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      });

      const result = await getStripeConfig();

      expect(result).not.toBeNull();
      expect(result?.accountId).toBe("acct_xxx");
      expect(result?.email).toBe("test@stripe.com");
      expect(result?.isConfigured).toBe(true);
    });

    it("should return null when not connected", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: { connected: false },
        error: null,
      });

      const result = await getStripeConfig();

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Error" },
      });

      const result = await getStripeConfig();

      expect(result).toBeNull();
    });
  });
});
