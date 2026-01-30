/**
 * Offers Service Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for offers.ts service functions:
 * - fetchOffersByProduct
 * 
 * Validates:
 * - API call with correct parameters
 * - Data normalization (price conversion, field mapping)
 * - Error handling
 * - Edge cases (empty, null fields)
 * 
 * @module services/__tests__/offers.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { API_GATEWAY_URL } from "@/config/supabase";
import { fetchOffersByProduct, type NormalizedOffer } from "../offers";
import { mockOffers, mockOffersWithNulls } from "@/test/mocks/handlers/offers-handlers";

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// fetchOffersByProduct Tests
// ============================================================================

describe("fetchOffersByProduct", () => {
  it("should fetch offers for product", async () => {
    const result = await fetchOffersByProduct("prod-001");

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("offer-001");
  });

  it("should normalize offer data correctly", async () => {
    const result = await fetchOffersByProduct("prod-001");

    const firstOffer = result[0];
    expect(firstOffer).toHaveProperty("id");
    expect(firstOffer).toHaveProperty("product_id");
    expect(firstOffer).toHaveProperty("price");
    expect(firstOffer).toHaveProperty("product_name");
    expect(firstOffer).toHaveProperty("updated_at");
  });

  it("should convert price to number", async () => {
    const result = await fetchOffersByProduct("prod-001");

    expect(typeof result[0].price).toBe("number");
    expect(result[0].price).toBe(9990);
    expect(result[1].price).toBe(19990);
    expect(result[2].price).toBe(0);
  });

  it("should return empty array when no offers", async () => {
    const result = await fetchOffersByProduct("prod-empty");
    expect(result).toEqual([]);
  });

  it("should map product_name from name field", async () => {
    const result = await fetchOffersByProduct("prod-001");

    expect(result[0].product_name).toBe("Oferta Básica");
    expect(result[1].product_name).toBe("Oferta Premium");
    expect(result[2].product_name).toBe("Oferta Gratuita");
  });

  it("should preserve updated_at field", async () => {
    const result = await fetchOffersByProduct("prod-001");

    expect(result[0].updated_at).toBe("2026-01-15T00:00:00Z");
    expect(result[1].updated_at).toBe("2026-01-20T00:00:00Z");
  });

  it("should throw on API error", async () => {
    await expect(fetchOffersByProduct("prod-error")).rejects.toThrow();
  });

  it("should handle null/undefined fields gracefully", async () => {
    const result = await fetchOffersByProduct("prod-002");

    expect(result).toHaveLength(1);
    expect(result[0].product_name).toBeNull();
    expect(result[0].updated_at).toBeNull();
    expect(result[0].price).toBe(5990);
  });

  it("should pass productId to API correctly", async () => {
    let capturedProductId: string | undefined;

    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/products-crud`, async ({ request }) => {
        const body = await request.json() as { productId?: string };
        capturedProductId = body.productId;
        return HttpResponse.json({ offers: [] });
      })
    );

    await fetchOffersByProduct("test-product-123");
    expect(capturedProductId).toBe("test-product-123");
  });

  it("should handle network error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/products-crud`, () => {
        return HttpResponse.error();
      })
    );

    await expect(fetchOffersByProduct("prod-001")).rejects.toThrow();
  });

  it("should return correct type structure", async () => {
    const result = await fetchOffersByProduct("prod-001");

    result.forEach((offer: NormalizedOffer) => {
      expect(typeof offer.id).toBe("string");
      expect(typeof offer.product_id).toBe("string");
      expect(typeof offer.price).toBe("number");
    });
  });
});
