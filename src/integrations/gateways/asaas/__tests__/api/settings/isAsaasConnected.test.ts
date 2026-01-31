/**
 * @file isAsaasConnected.test.ts
 * @description Tests for isAsaasConnected API function
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
import { isAsaasConnected } from "../../../api/settings-api";

describe("isAsaasConnected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when connected", async () => {
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

    const result = await isAsaasConnected("vendor-123");

    expect(result).toBe(true);
  });

  it("should return false when not connected", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          config: {
            has_api_key: false,
          },
        },
      },
      error: null,
    });

    const result = await isAsaasConnected("vendor-123");

    expect(result).toBe(false);
  });

  it("should return false when no settings exist", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: { success: false },
      error: null,
    });

    const result = await isAsaasConnected("vendor-123");

    expect(result).toBe(false);
  });

  it("should return false on error", async () => {
    vi.mocked(api.publicCall).mockResolvedValueOnce({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Error" },
    });

    const result = await isAsaasConnected("vendor-123");

    expect(result).toBe(false);
  });
});
