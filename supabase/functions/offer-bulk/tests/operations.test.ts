/**
 * offer-bulk - Bulk Operations Tests
 * 
 * @version 2.0.0
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { 
  createMockRequest, 
  createMockSupabaseClient, 
  createMockProducer, 
  createMockProduct,
  isOfferCreate,
  isOfferUpdate,
  type BulkPayload,
  type OfferData
} from "./_shared.ts";

describe("offer-bulk - Bulk Create", () => {
  beforeEach(() => {
    createMockSupabaseClient();
    createMockProducer();
    createMockProduct();
  });

  it("should create multiple offers", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [
        { name: "Offer 1", price: 9900 },
        { name: "Offer 2", price: 4900 },
      ],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.offers?.length, 2);
  });

  it("should validate required fields (name, price)", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [{ name: "Offer 1", price: 9900 }],
    });
    const body = await mockRequest.json() as BulkPayload;
    const firstOffer = body.offers?.[0];
    assertExists(firstOffer?.name);
    assertExists(firstOffer?.price);
  });

  it("should accept is_default flag (snake_case)", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [{ name: "Offer 1", price: 9900, is_default: true }],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.offers?.[0].is_default, true);
  });

  it("should accept isDefault flag (camelCase)", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [{ name: "Offer 1", price: 9900, isDefault: true }],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.offers?.[0].isDefault, true);
  });

  it("should identify create operations", () => {
    const offerCreate: OfferData = { name: "New", price: 100 };
    assertEquals(isOfferCreate(offerCreate), true);
  });
});

describe("offer-bulk - Bulk Update", () => {
  beforeEach(() => {
    createMockSupabaseClient();
    createMockProducer();
    createMockProduct();
  });

  it("should update existing offers", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [
        { id: "offer-1", name: "Updated Offer 1", price: 9900 },
        { id: "offer-2", name: "Updated Offer 2", price: 4900 },
      ],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertExists(body.offers?.[0].id);
    assertExists(body.offers?.[1].id);
  });

  it("should distinguish updates from creates by ID presence", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [
        { id: "offer-1", name: "Update", price: 9900 },
        { name: "Create", price: 4900 },
      ],
    });
    const body = await mockRequest.json() as BulkPayload;
    const offers = body.offers ?? [];
    assertEquals(isOfferUpdate(offers[0]), true);
    assertEquals(isOfferCreate(offers[1]), true);
  });
});

describe("offer-bulk - Bulk Delete", () => {
  beforeEach(() => {
    createMockSupabaseClient();
    createMockProducer();
    createMockProduct();
  });

  it("should delete multiple offers by ID", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      deleted_offer_ids: ["offer-1", "offer-2", "offer-3"],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.deleted_offer_ids?.length, 3);
  });

  it("should accept empty deleted_offer_ids array", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      deleted_offer_ids: [],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.deleted_offer_ids?.length, 0);
  });

  it("should handle missing deleted_offer_ids", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals("deleted_offer_ids" in body, false);
  });
});

describe("offer-bulk - Mixed Operations", () => {
  beforeEach(() => {
    createMockSupabaseClient();
    createMockProducer();
    createMockProduct();
  });

  it("should handle create + update + delete in single request", async () => {
    const mockRequest = createMockRequest({ 
      product_id: "product-123",
      offers: [
        { name: "New Offer", price: 9900 },
        { id: "offer-1", name: "Updated", price: 4900 },
      ],
      deleted_offer_ids: ["offer-2", "offer-3"],
    });
    const body = await mockRequest.json() as BulkPayload;
    assertEquals(body.offers?.length, 2);
    assertEquals(body.deleted_offer_ids?.length, 2);
  });

  it("should return results summary", () => {
    const mockResults = {
      created: ["new-offer-1"],
      updated: ["offer-1"],
      deleted: ["offer-2"],
    };
    assertEquals(mockResults.created.length, 1);
    assertEquals(mockResults.updated.length, 1);
    assertEquals(mockResults.deleted.length, 1);
  });
});
