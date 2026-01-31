/**
 * @file getAsaasSettings.test.ts
 * @description Tests for getAsaasSettings API function
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
import { getAsaasSettings } from "../../../api/settings-api";

describe("getAsaasSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return config when settings exist", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          config: {
            environment: "production",
            has_api_key: true,
          },
        },
      },
      error: null,
    });

    const result = await getAsaasSettings("vendor-123");

    expect(result).not.toBeNull();
    expect(result?.environment).toBe("production");
    expect(api.publicCall).toHaveBeenCalledWith("vendor-integrations", {
      action: "get-config",
      vendorId: "vendor-123",
      integrationType: "ASAAS",
    });
  });

  it("should return null when no settings exist", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: { success: false },
      error: null,
    });

    const result = await getAsaasSettings("vendor-123");

    expect(result).toBeNull();
  });

  it("should return null on API error", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: null,
      error: { code: "NETWORK_ERROR", message: "Network error" },
    });

    const result = await getAsaasSettings("vendor-123");

    expect(result).toBeNull();
  });

  it("should return null on exception", async () => {
    vi.mocked(api.publicCall).mockRejectedValueOnce(
      new Error("Connection failed")
    );

    const result = await getAsaasSettings("vendor-123");

    expect(result).toBeNull();
  });

  it("should handle sandbox environment", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          config: {
            environment: "sandbox",
            has_api_key: true,
          },
        },
      },
      error: null,
    });

    const result = await getAsaasSettings("vendor-123");

    expect(result?.environment).toBe("sandbox");
  });

  it("should default environment to sandbox when not provided", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          config: {},
        },
      },
      error: null,
    });

    const result = await getAsaasSettings("vendor-123");

    expect(result?.environment).toBe("sandbox");
  });
});
