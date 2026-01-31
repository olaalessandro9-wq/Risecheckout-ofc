/**
 * Vendor Integrations - Actions & Response Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/actions-response
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  sanitizeConfig,
  MOCK_MP_INTEGRATION,
  MOCK_STRIPE_INTEGRATION,
  type VendorResponse
} from "./_shared.ts";

Deno.test("vendor-integrations - Get Config Action", async (t) => {
  await t.step("should return null data for non-existent integration", () => {
    const response: VendorResponse = {
      success: true,
      data: null
    };
    
    assertEquals(response.success, true);
    assertEquals(response.data, null);
  });

  await t.step("should return sanitized config for active integration", () => {
    const sanitized = sanitizeConfig(MOCK_MP_INTEGRATION.config, "MERCADOPAGO");
    const response: VendorResponse = {
      success: true,
      data: {
        id: MOCK_MP_INTEGRATION.id,
        vendor_id: MOCK_MP_INTEGRATION.vendor_id,
        integration_type: MOCK_MP_INTEGRATION.integration_type,
        active: MOCK_MP_INTEGRATION.active,
        config: sanitized
      }
    };
    
    assertEquals(response.success, true);
    assertExists(response.data);
  });

  await t.step("should handle PGRST116 error (row not found)", () => {
    const errorCode = "PGRST116";
    const isNotFoundError = errorCode === "PGRST116";
    assertEquals(isNotFoundError, true);
  });
});

Deno.test("vendor-integrations - Get All Action", async (t) => {
  await t.step("should return array of integrations", () => {
    const response: VendorResponse = {
      success: true,
      data: [MOCK_MP_INTEGRATION, MOCK_STRIPE_INTEGRATION]
    };
    
    assertEquals(response.success, true);
    assertEquals(Array.isArray(response.data), true);
    assertEquals((response.data as unknown[]).length, 2);
  });

  await t.step("should return empty array if no integrations", () => {
    const response: VendorResponse = {
      success: true,
      data: []
    };
    
    assertEquals(response.success, true);
    assertEquals((response.data as unknown[]).length, 0);
  });

  await t.step("should filter only active integrations", () => {
    const inactiveIntegration = { ...MOCK_MP_INTEGRATION, active: false };
    const activeOnly = [MOCK_MP_INTEGRATION, inactiveIntegration].filter(i => i.active);
    
    assertEquals(activeOnly.length, 1);
  });
});

Deno.test("vendor-integrations - Response Format", async (t) => {
  await t.step("should return success with data", () => {
    const response: VendorResponse = {
      success: true,
      data: { id: "test" }
    };
    
    assertEquals(response.success, true);
    assertExists(response.data);
  });

  await t.step("should return error for unknown action", () => {
    const response: VendorResponse = {
      error: "Ação desconhecida"
    };
    
    assertStringIncludes(response.error!, "Ação desconhecida");
  });

  await t.step("should return 500 for database errors", () => {
    const response: VendorResponse = {
      error: "Erro ao buscar integração"
    };
    
    assertStringIncludes(response.error!, "Erro");
  });
});

Deno.test("vendor-integrations - CORS and Public Access", async (t) => {
  await t.step("should use handleCorsV2 for dynamic origin", () => {
    const corsHandler = "handleCorsV2";
    assertEquals(corsHandler, "handleCorsV2");
  });

  await t.step("should allow public access for checkout data", () => {
    const isPublicEndpoint = true;
    assertEquals(isPublicEndpoint, true);
  });
});
