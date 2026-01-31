/**
 * @file disconnectAsaas.test.ts
 * @description Tests for disconnectAsaas API function
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the API client
vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
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
import { disconnectAsaas } from "../../../api/settings-api";

describe("disconnectAsaas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should disconnect successfully", async () => {
    vi.mocked(api.call)
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    const result = await disconnectAsaas();

    expect(result.success).toBe(true);
    expect(api.call).toHaveBeenCalledWith("integration-management", {
      action: "disconnect",
      integrationType: "ASAAS",
    });
  });

  it("should clear wallet_id on disconnect", async () => {
    vi.mocked(api.call)
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    await disconnectAsaas();

    expect(api.call).toHaveBeenNthCalledWith(2, "integration-management", {
      action: "clear-profile-wallet",
    });
  });

  it("should return error on disconnect failure", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: false, error: "Not authorized" },
      error: null,
    });

    const result = await disconnectAsaas();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not authorized");
  });

  it("should handle API error during disconnect", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Server error" },
    });

    const result = await disconnectAsaas();

    expect(result.success).toBe(false);
  });

  it("should handle exception during disconnect", async () => {
    vi.mocked(api.call).mockRejectedValueOnce(new Error("Network error"));

    const result = await disconnectAsaas();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Erro ao desconectar");
  });
});
