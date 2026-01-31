/**
 * @file validation-api.test.ts
 * @description Tests for Asaas Validation API functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the API client
vi.mock("@/lib/api", () => ({
  api: {
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

import { api } from "@/lib/api";
import { validateAsaasCredentials } from "../../api/validation-api";

describe("Asaas Validation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateAsaasCredentials", () => {
    describe("Valid Credentials", () => {
      it("should return valid for correct production API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: true,
            accountName: "Test Company LTDA",
            walletId: "12345678-abcd-1234-efgh-123456789012",
          },
          error: null,
        });

        const result = await validateAsaasCredentials(
          "$aact_prod_xxx",
          "production"
        );

        expect(result.valid).toBe(true);
        expect(result.accountName).toBe("Test Company LTDA");
        expect(result.walletId).toBe("12345678-abcd-1234-efgh-123456789012");
      });

      it("should return valid for correct sandbox API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: true,
            accountName: "Sandbox Account",
            walletId: "sandbox-wallet-id",
          },
          error: null,
        });

        const result = await validateAsaasCredentials(
          "$aact_sandbox_xxx",
          "sandbox"
        );

        expect(result.valid).toBe(true);
        expect(result.accountName).toBe("Sandbox Account");
      });

      it("should call API with correct parameters", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: { valid: true },
          error: null,
        });

        await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(api.publicCall).toHaveBeenCalledWith(
          "asaas-validate-credentials",
          {
            apiKey: "$aact_prod_xxx",
            environment: "production",
          }
        );
      });
    });

    describe("Invalid Credentials", () => {
      it("should return invalid for incorrect API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: false,
            message: "API key inválida",
          },
          error: null,
        });

        const result = await validateAsaasCredentials("invalid_key", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBe("API key inválida");
      });

      it("should return invalid for expired API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: false,
            message: "API key expirada",
          },
          error: null,
        });

        const result = await validateAsaasCredentials("expired_key", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBe("API key expirada");
      });

      it("should return invalid for revoked API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: false,
            message: "API key revogada",
          },
          error: null,
        });

        const result = await validateAsaasCredentials("revoked_key", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBe("API key revogada");
      });
    });

    describe("API Errors", () => {
      it("should return invalid on API error", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: null,
          error: { code: "INTERNAL_ERROR", message: "Service unavailable" },
        });

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBe("Service unavailable");
      });

      it("should return invalid on exception", async () => {
        vi.mocked(api.publicCall).mockRejectedValueOnce(
          new Error("Network error")
        );

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBe("Erro de conexão ao validar credenciais");
      });

      it("should handle timeout gracefully", async () => {
        vi.mocked(api.publicCall).mockRejectedValueOnce(
          new Error("Request timeout")
        );

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    describe("Edge Cases", () => {
      it("should handle null data response", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: null,
          error: null,
        });

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(false);
      });

      it("should handle missing valid field in response", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            accountName: "Test",
          },
          error: null,
        });

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(false);
      });

      it("should handle undefined message gracefully", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: true,
          },
          error: null,
        });

        const result = await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      it("should handle empty API key", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: {
            valid: false,
            message: "API key é obrigatória",
          },
          error: null,
        });

        const result = await validateAsaasCredentials("", "production");

        expect(result.valid).toBe(false);
      });
    });

    describe("Environment Handling", () => {
      it("should pass production environment correctly", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: { valid: true },
          error: null,
        });

        await validateAsaasCredentials("$aact_prod_xxx", "production");

        expect(api.publicCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            environment: "production",
          })
        );
      });

      it("should pass sandbox environment correctly", async () => {
        vi.mocked(api.publicCall).mockResolvedValueOnce({
          data: { valid: true },
          error: null,
        });

        await validateAsaasCredentials("$aact_sandbox_xxx", "sandbox");

        expect(api.publicCall).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            environment: "sandbox",
          })
        );
      });
    });
  });
});
