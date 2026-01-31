/**
 * @file saveAsaasSettings.test.ts
 * @description Tests for saveAsaasSettings API function
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
import { saveAsaasSettings } from "../../../api/settings-api";
import type { AsaasIntegrationConfig } from "../../../types";

describe("saveAsaasSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validConfig: AsaasIntegrationConfig = {
    api_key: "$aact_prod_xxx",
    environment: "production",
    wallet_id: "12345678-abcd-1234-efgh-123456789012",
    validated_at: "2026-01-31T00:00:00Z",
    account_name: "Test Account",
  };

  it("should save settings successfully", async () => {
    vi.mocked(api.call)
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    const result = await saveAsaasSettings(validConfig);

    expect(result.success).toBe(true);
    expect(api.call).toHaveBeenCalledWith("integration-management", {
      action: "save-credentials",
      integrationType: "ASAAS",
      config: {
        api_key: validConfig.api_key,
        environment: validConfig.environment,
        wallet_id: validConfig.wallet_id,
        validated_at: validConfig.validated_at,
        account_name: validConfig.account_name,
      },
    });
  });

  it("should return error on save failure", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: false, error: "Database error" },
      error: null,
    });

    const result = await saveAsaasSettings(validConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database error");
  });

  it("should handle API error", async () => {
    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Service unavailable" },
    });

    const result = await saveAsaasSettings(validConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Service unavailable");
  });

  it("should handle exception during save", async () => {
    vi.mocked(api.call).mockRejectedValueOnce(new Error("Network error"));

    const result = await saveAsaasSettings(validConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Erro ao salvar configurações");
  });

  it("should save wallet_id to profile when provided", async () => {
    vi.mocked(api.call)
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    await saveAsaasSettings(validConfig);

    expect(api.call).toHaveBeenCalledTimes(2);
    expect(api.call).toHaveBeenNthCalledWith(2, "integration-management", {
      action: "save-profile-wallet",
      walletId: validConfig.wallet_id,
    });
  });

  it("should not save wallet_id when not provided", async () => {
    const configWithoutWallet: AsaasIntegrationConfig = {
      api_key: "$aact_prod_xxx",
      environment: "production",
    };

    vi.mocked(api.call).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    await saveAsaasSettings(configWithoutWallet);

    expect(api.call).toHaveBeenCalledTimes(1);
  });
});
