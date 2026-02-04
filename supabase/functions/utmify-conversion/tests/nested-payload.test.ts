/**
 * Nested Payload Tests for utmify-conversion
 * 
 * @module utmify-conversion/tests/nested-payload.test
 * @version 2.1.0 - RISE Protocol V3 Compliant
 * 
 * Testes para validar que a Edge Function aceita o payload
 * aninhado enviado pelo frontend (com orderData)
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import {
  createDefaultConversionPayload,
  createConversionPayloadWithUtm,
  createNestedFrontendPayload,
  createNestedFrontendPayloadWithUtm,
} from "./_shared.ts";
import { validateRequest, normalizePayload } from "../validators.ts";

describe("utmify-conversion - Nested Payload (Frontend Format)", () => {
  describe("Payload Detection", () => {
    it("should detect nested frontend payload structure", () => {
      const nestedPayload = createNestedFrontendPayload();
      
      assertExists(nestedPayload.vendorId);
      assertExists(nestedPayload.orderData);
      assertEquals(typeof nestedPayload.orderData, "object");
    });

    it("should detect flat payload structure", () => {
      const flatPayload = createDefaultConversionPayload();
      
      assertExists(flatPayload.orderId);
      assertExists(flatPayload.vendorId);
      // Flat payload should not have orderData property
      assertEquals("orderData" in flatPayload, false);
    });
  });

  describe("Payload Normalization", () => {
    it("should normalize nested payload to flat structure", () => {
      const nestedPayload = createNestedFrontendPayload();
      const normalized = normalizePayload(nestedPayload as unknown as Record<string, unknown>);
      
      // Campos devem estar na raiz após normalização
      assertExists(normalized.orderId);
      assertExists(normalized.vendorId);
      assertExists(normalized.paymentMethod);
      assertExists(normalized.status);
      assertExists(normalized.customer);
      assertExists(normalized.products);
      assertExists(normalized.commission);
    });

    it("should preserve flat payload unchanged", () => {
      const flatPayload = createDefaultConversionPayload();
      const normalized = normalizePayload(flatPayload as unknown as Record<string, unknown>);
      
      assertEquals(normalized.orderId, flatPayload.orderId);
      assertEquals(normalized.vendorId, flatPayload.vendorId);
    });

    it("should extract UTM parameters from nested payload", () => {
      const nestedPayload = createNestedFrontendPayloadWithUtm();
      const normalized = normalizePayload(nestedPayload as unknown as Record<string, unknown>);
      
      assertExists(normalized.trackingParameters);
      const tracking = normalized.trackingParameters as Record<string, unknown>;
      assertEquals(tracking.utm_source, "google");
      assertEquals(tracking.utm_medium, "cpc");
      assertEquals(tracking.utm_campaign, "summer_sale");
    });

    it("should create commission object from totalPriceInCents if commission is missing", () => {
      const nestedPayload = createNestedFrontendPayload();
      // Remover commission do orderData para testar fallback
      const payloadWithoutCommission = {
        vendorId: nestedPayload.vendorId,
        orderData: {
          ...nestedPayload.orderData,
          commission: undefined,
          totalPriceInCents: 9990,
        },
        eventType: nestedPayload.eventType,
        productId: nestedPayload.productId,
      };
      
      const normalized = normalizePayload(payloadWithoutCommission as unknown as Record<string, unknown>);
      
      assertExists(normalized.commission);
      const commission = normalized.commission as Record<string, unknown>;
      assertEquals(commission.totalPriceInCents, 9990);
      assertEquals(commission.currency, "BRL");
    });
  });

  describe("Validation with Nested Payload", () => {
    it("should validate nested frontend payload successfully", () => {
      const nestedPayload = createNestedFrontendPayload();
      const result = validateRequest(nestedPayload);
      
      assertEquals(result.valid, true);
      assertEquals(result.errors.length, 0);
      assertExists(result.normalizedPayload);
    });

    it("should validate nested frontend payload with UTM successfully", () => {
      const nestedPayload = createNestedFrontendPayloadWithUtm();
      const result = validateRequest(nestedPayload);
      
      assertEquals(result.valid, true);
      assertEquals(result.errors.length, 0);
      assertExists(result.normalizedPayload);
    });

    it("should return normalized payload after validation", () => {
      const nestedPayload = createNestedFrontendPayload();
      const result = validateRequest(nestedPayload);
      
      assertExists(result.normalizedPayload);
      assertEquals(result.normalizedPayload!.orderId, nestedPayload.orderData.orderId);
      assertEquals(result.normalizedPayload!.vendorId, nestedPayload.vendorId);
    });

    it("should still validate flat payloads successfully", () => {
      const flatPayload = createDefaultConversionPayload();
      const result = validateRequest(flatPayload);
      
      assertEquals(result.valid, true);
      assertEquals(result.errors.length, 0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing optional fields in nested payload", () => {
      const nestedPayload = createNestedFrontendPayload();
      // Remover campos opcionais
      nestedPayload.orderData.approvedDate = null;
      nestedPayload.orderData.refundedAt = null;
      nestedPayload.orderData.trackingParameters = undefined;
      
      const result = validateRequest(nestedPayload);
      
      assertEquals(result.valid, true);
    });

    it("should fail validation if orderData is missing required fields", () => {
      const invalidPayload = {
        vendorId: "vendor-123",
        orderData: {
          // Missing orderId, status, customer, products
          createdAt: new Date().toISOString(),
        },
        eventType: "purchase",
      };
      
      const result = validateRequest(invalidPayload);
      
      assertEquals(result.valid, false);
      assertEquals(result.errors.some(e => e.includes("orderId")), true);
    });

    it("should ignore extra fields like eventType and productId", () => {
      const nestedPayload = createNestedFrontendPayload();
      
      // Estes campos são enviados pelo frontend mas não usados pela Edge Function
      assertEquals(nestedPayload.eventType, "purchase");
      assertEquals(typeof nestedPayload.productId, "string");
      
      // A validação deve passar mesmo com esses campos extras
      const result = validateRequest(nestedPayload);
      assertEquals(result.valid, true);
    });
  });

  describe("Backward Compatibility", () => {
    it("should accept both payload formats interchangeably", () => {
      const flatPayload = createDefaultConversionPayload();
      const nestedPayload = createNestedFrontendPayload();
      
      const flatResult = validateRequest(flatPayload);
      const nestedResult = validateRequest(nestedPayload);
      
      assertEquals(flatResult.valid, true);
      assertEquals(nestedResult.valid, true);
    });

    it("should produce same normalized structure from both formats", () => {
      const flatPayload = createConversionPayloadWithUtm();
      const nestedPayload = createNestedFrontendPayloadWithUtm();
      
      const flatResult = validateRequest(flatPayload);
      const nestedResult = validateRequest(nestedPayload);
      
      // Ambos devem ter a mesma estrutura normalizada
      assertExists(flatResult.normalizedPayload?.customer);
      assertExists(nestedResult.normalizedPayload?.customer);
      assertExists(flatResult.normalizedPayload?.products);
      assertExists(nestedResult.normalizedPayload?.products);
    });
  });
});
