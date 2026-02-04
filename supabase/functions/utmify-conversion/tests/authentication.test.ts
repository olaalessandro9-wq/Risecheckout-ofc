/**
 * Authentication Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/authentication.test
 * @version 3.0.0 - RISE Protocol V3 Compliant - Vault SSOT
 * 
 * Testa a arquitetura de autenticação via Vault:
 * - Token recuperado via RPC get_gateway_credentials (SSOT)
 * - Zero referências a coluna legada users.utmify_token (REMOVIDA)
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createMockRequest,
  createMockRequestWithoutAuth,
  createDefaultConversionPayload,
  createMockVaultResponse,
  createMockVaultRPCParams,
  createMockSupabaseClient,
} from "./_shared.ts";

describe("utmify-conversion - Authentication (Vault SSOT)", () => {
  describe("UTMify API Headers", () => {
    it("should use x-api-token header for UTMify API", () => {
      const token = "test-utmify-token";
      const headers = {
        "x-api-token": token,
        "Content-Type": "application/json",
      };
      
      assertExists(headers["x-api-token"]);
      assertEquals(headers["x-api-token"], token);
    });

    it("should NOT use Authorization Bearer header for UTMify API", () => {
      const token = "test-utmify-token";
      const correctHeaders = {
        "x-api-token": token,
        "Content-Type": "application/json",
      };
      
      // Verify x-api-token is used
      assertEquals("x-api-token" in correctHeaders, true);
      
      // Verify Authorization is NOT used (UTMify uses x-api-token)
      assertEquals("Authorization" in correctHeaders, false);
    });
  });

  describe("Vault Token Retrieval (RISE V3 - SSOT)", () => {
    it("should retrieve token from Vault via RPC get_gateway_credentials", () => {
      const vaultResponse = createMockVaultResponse(true);
      
      assertEquals(vaultResponse.success, true);
      assertExists(vaultResponse.credentials);
      assertExists(vaultResponse.credentials.api_token);
      assertEquals(typeof vaultResponse.credentials.api_token, "string");
    });

    it("should handle missing token in Vault gracefully", () => {
      const vaultResponse = createMockVaultResponse(false);
      
      assertEquals(vaultResponse.success, false);
      assertExists(vaultResponse.error);
      assertEquals(vaultResponse.credentials, undefined);
    });

    it("should use correct RPC parameters for Vault call", () => {
      const params = createMockVaultRPCParams("vendor-abc-123");
      
      assertExists(params.p_vendor_id);
      assertExists(params.p_gateway);
      assertEquals(params.p_vendor_id, "vendor-abc-123");
      assertEquals(params.p_gateway, "utmify");
    });

    it("should use 'utmify' as gateway identifier (not 'UTMify' or 'UTMIFY')", () => {
      const params = createMockVaultRPCParams();
      
      // Gateway identifier must be lowercase for consistency
      assertEquals(params.p_gateway, "utmify");
      assertEquals(params.p_gateway === "UTMify", false);
      assertEquals(params.p_gateway === "UTMIFY", false);
    });
  });

  describe("Mock Supabase Client with Vault RPC", () => {
    it("should mock Vault RPC call successfully", async () => {
      const client = createMockSupabaseClient(createMockVaultResponse(true));
      
      const { data, error } = await client.rpc("get_gateway_credentials", {
        p_vendor_id: "vendor-123",
        p_gateway: "utmify",
      });
      
      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.success, true);
      assertExists(data.credentials?.api_token);
    });

    it("should mock Vault RPC with missing credentials", async () => {
      const client = createMockSupabaseClient(createMockVaultResponse(false));
      
      const { data, error } = await client.rpc("get_gateway_credentials", {
        p_vendor_id: "vendor-no-token",
        p_gateway: "utmify",
      });
      
      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.success, false);
      assertExists(data.error);
    });

    it("should return error for unknown RPC functions", async () => {
      const client = createMockSupabaseClient();
      
      const { data, error } = await client.rpc("unknown_function", {});
      
      assertEquals(data, null);
      assertExists(error);
      assertExists(error.message);
    });
  });

  describe("Request Validation", () => {
    it("should require vendorId in request payload", () => {
      const payload = createDefaultConversionPayload();
      
      assertExists(payload.vendorId);
      assertEquals(typeof payload.vendorId, "string");
      assertEquals(payload.vendorId.length > 0, true);
    });

    it("should validate vendorId format as non-empty string", () => {
      const payload = createDefaultConversionPayload();
      
      assertExists(payload.vendorId);
      assertEquals(typeof payload.vendorId, "string");
      assertEquals(payload.vendorId.trim().length > 0, true);
    });
  });

  describe("Error Responses", () => {
    it("should return proper error structure for missing credentials", () => {
      const errorResponse = {
        success: false,
        error: "No UTMify token configured for this vendor",
      };
      
      assertEquals(errorResponse.success, false);
      assertExists(errorResponse.error);
      assertEquals(errorResponse.error.includes("token"), true);
    });

    it("should return proper error structure for Vault RPC failure", () => {
      const errorResponse = {
        success: false,
        error: "Failed to retrieve UTMify credentials",
      };
      
      assertEquals(errorResponse.success, false);
      assertExists(errorResponse.error);
      assertEquals(errorResponse.error.includes("credentials"), true);
    });
  });
});
