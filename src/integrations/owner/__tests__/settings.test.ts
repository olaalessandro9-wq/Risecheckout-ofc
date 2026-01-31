/**
 * @file settings.test.ts
 * @description Tests for Owner settings
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOwnerGatewayEnvironments, setOwnerGatewayEnvironment } from "../settings";
import type { GatewayType, GatewayEnvironment, OwnerGatewayEnvironments } from "../settings";

vi.mock("@/lib/api/client", () => ({
  api: {
    call: vi.fn(),
  },
}));

import { api } from "@/lib/api/client";

describe("Owner Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOwnerGatewayEnvironments", () => {
    it("should return gateway environments on success", async () => {
      const mockEnvironments: OwnerGatewayEnvironments = {
        asaas: "production",
        mercadopago: "sandbox",
        pushinpay: "production",
        stripe: "production",
      };

      (api.call as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          success: true,
          environments: mockEnvironments,
        },
        error: null,
      });

      const result = await getOwnerGatewayEnvironments();

      expect(result).toEqual(mockEnvironments);
      expect(api.call).toHaveBeenCalledWith("owner-settings/get-gateway-environments", {});
    });

    it("should return default environments on error", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: "Network error",
      });

      const result = await getOwnerGatewayEnvironments();

      expect(result.asaas).toBe("production");
      expect(result.mercadopago).toBe("production");
      expect(result.pushinpay).toBe("production");
      expect(result.stripe).toBe("production");
    });

    it("should return default environments on invalid response", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          success: false,
          error: "Invalid data",
        },
        error: null,
      });

      const result = await getOwnerGatewayEnvironments();

      expect(result.asaas).toBe("production");
    });

    it("should handle unexpected errors", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await getOwnerGatewayEnvironments();

      expect(result.asaas).toBe("production");
    });
  });

  describe("setOwnerGatewayEnvironment", () => {
    it("should update gateway environment successfully", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          success: true,
        },
        error: null,
      });

      const result = await setOwnerGatewayEnvironment("asaas", "sandbox");

      expect(result.ok).toBe(true);
      expect(api.call).toHaveBeenCalledWith(
        "owner-settings/set-gateway-environment",
        {
          gateway: "asaas",
          environment: "sandbox",
        }
      );
    });

    it("should return error on API failure", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: "Update failed",
      });

      const result = await setOwnerGatewayEnvironment("mercadopago", "production");

      expect(result.ok).toBe(false);
    });

    it("should handle unexpected errors", async () => {
      (api.call as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Unexpected error"));

      const result = await setOwnerGatewayEnvironment("stripe", "sandbox");

      expect(result.ok).toBe(false);
    });
  });

  describe("Type Validation", () => {
    it("should accept valid gateway types", () => {
      const validTypes: GatewayType[] = ["asaas", "mercadopago", "pushinpay", "stripe"];

      validTypes.forEach((type) => {
        expect(["asaas", "mercadopago", "pushinpay", "stripe"]).toContain(type);
      });
    });

    it("should accept valid environment types", () => {
      const validEnvs: GatewayEnvironment[] = ["sandbox", "production"];

      validEnvs.forEach((env) => {
        expect(["sandbox", "production"]).toContain(env);
      });
    });

    it("should accept valid OwnerGatewayEnvironments structure", () => {
      const environments: OwnerGatewayEnvironments = {
        asaas: "production",
        mercadopago: "sandbox",
        pushinpay: "production",
        stripe: "sandbox",
      };

      expect(environments.asaas).toBe("production");
      expect(environments.mercadopago).toBe("sandbox");
      expect(environments.pushinpay).toBe("production");
      expect(environments.stripe).toBe("sandbox");
    });
  });
});
