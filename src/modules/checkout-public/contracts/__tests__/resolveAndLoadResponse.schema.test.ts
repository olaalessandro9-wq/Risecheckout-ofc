/**
 * Checkout Public Contracts Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Zod schema validation.
 * 
 * @module test/checkout-public/contracts
 */

import { describe, it, expect } from "vitest";
import {
  AffiliateSchema,
  OfferSchema,
  OrderBumpSchema,
  ProductSchema,
  CheckoutSchema,
  ResolveAndLoadResponseSchema,
  ErrorResponseSchema,
  validateResolveAndLoadResponse,
} from "../resolveAndLoadResponse.schema";

// ============================================================================
// HELPERS
// ============================================================================

function createValidCheckout() {
  return {
    id: "checkout-123",
    name: "Test Checkout",
    slug: "test-checkout",
    visits_count: 100,
    seller_name: "Vendedor",
    font: "Inter",
    theme: "light",
    design: null,
    components: null,
    top_components: null,
    bottom_components: null,
    pix_gateway: null,
    credit_card_gateway: null,
    mercadopago_public_key: null,
    stripe_public_key: null,
  };
}

function createValidProduct() {
  return {
    id: "product-123",
    user_id: "user-456",
    name: "Test Product",
    description: "Product description",
    price: 9900,
    image_url: "https://example.com/image.jpg",
    support_name: "Suporte",
    required_fields: { phone: true, cpf: false },
    default_payment_method: "pix" as const,
    pix_gateway: "mercadopago",
    credit_card_gateway: "mercadopago",
    upsell_settings: null,
    affiliate_settings: null,
    status: "active",
  };
}

function createValidOrderBump() {
  return {
    id: "bump-1",
    product_id: "prod-1",
    name: "Bump Offer",
    description: "Add this to your order",
    price: 1900,
    original_price: 2900,
    image_url: "https://example.com/bump.jpg",
    call_to_action: "Add to cart",
    product: null,
    offer: null,
  };
}

function createValidResponse() {
  return {
    success: true as const,
    data: {
      checkout: createValidCheckout(),
      product: createValidProduct(),
      offer: null,
      orderBumps: [],
      affiliate: null,
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("AffiliateSchema", () => {
  it("should validate correct affiliate data", () => {
    const affiliate = {
      affiliateId: "aff-123",
      affiliateCode: "PARTNER50",
      affiliateUserId: "user-789",
      commissionRate: 30,
      pixGateway: "pushinpay",
      creditCardGateway: "stripe",
    };

    const result = AffiliateSchema.safeParse(affiliate);
    expect(result.success).toBe(true);
  });

  it("should accept null gateways", () => {
    const affiliate = {
      affiliateId: "aff-123",
      affiliateCode: "CODE",
      affiliateUserId: "user-1",
      commissionRate: null,
      pixGateway: null,
      creditCardGateway: null,
    };

    const result = AffiliateSchema.safeParse(affiliate);
    expect(result.success).toBe(true);
  });

  it("should accept null (affiliate is nullable)", () => {
    const result = AffiliateSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const affiliate = {
      affiliateId: "aff-123",
      // missing affiliateCode
    };

    const result = AffiliateSchema.safeParse(affiliate);
    expect(result.success).toBe(false);
  });
});

describe("OfferSchema", () => {
  it("should validate correct offer data", () => {
    const offer = {
      offerId: "offer-123",
      offerName: "Special Offer",
      offerPrice: 4900,
    };

    const result = OfferSchema.safeParse(offer);
    expect(result.success).toBe(true);
  });

  it("should accept null (offer is nullable)", () => {
    const result = OfferSchema.safeParse(null);
    expect(result.success).toBe(true);
  });

  it("should reject invalid price type", () => {
    const offer = {
      offerId: "offer-123",
      offerName: "Offer",
      offerPrice: "invalid",
    };

    const result = OfferSchema.safeParse(offer);
    expect(result.success).toBe(false);
  });
});

describe("OrderBumpSchema", () => {
  it("should validate complete order bump", () => {
    const bump = createValidOrderBump();
    const result = OrderBumpSchema.safeParse(bump);
    expect(result.success).toBe(true);
  });

  it("should accept nullable fields", () => {
    const bump = {
      id: "bump-1",
      product_id: null,
      name: "Bump",
      description: null,
      price: 1000,
      original_price: null,
      image_url: null,
      call_to_action: null,
      product: null,
      offer: null,
    };

    const result = OrderBumpSchema.safeParse(bump);
    expect(result.success).toBe(true);
  });

  it("should accept bump with product relation", () => {
    const bump = {
      ...createValidOrderBump(),
      product: {
        id: "prod-1",
        name: "Product",
        description: "Desc",
        price: 1000,
        image_url: null,
      },
    };

    const result = OrderBumpSchema.safeParse(bump);
    expect(result.success).toBe(true);
  });

  it("should accept bump with offer relation", () => {
    const bump = {
      ...createValidOrderBump(),
      offer: {
        id: "offer-1",
        name: "Offer",
        price: 500,
      },
    };

    const result = OrderBumpSchema.safeParse(bump);
    expect(result.success).toBe(true);
  });
});

describe("ProductSchema", () => {
  it("should validate complete product", () => {
    const product = createValidProduct();
    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it("should accept null image_url", () => {
    const product = {
      ...createValidProduct(),
      image_url: null,
    };

    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it("should accept credit_card as default_payment_method", () => {
    const product = {
      ...createValidProduct(),
      default_payment_method: "credit_card" as const,
    };

    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const product = {
      id: "prod-1",
      // missing name, price, etc.
    };

    const result = ProductSchema.safeParse(product);
    expect(result.success).toBe(false);
  });
});

describe("CheckoutSchema", () => {
  it("should validate complete checkout", () => {
    const checkout = createValidCheckout();
    const result = CheckoutSchema.safeParse(checkout);
    expect(result.success).toBe(true);
  });

  it("should accept all nullable fields as null", () => {
    const checkout = {
      id: "checkout-1",
      name: "Checkout",
      slug: "checkout",
      visits_count: 0,
      seller_name: null,
      font: null,
      theme: null,
      design: null,
      components: null,
      top_components: null,
      bottom_components: null,
      pix_gateway: null,
      credit_card_gateway: null,
      mercadopago_public_key: null,
      stripe_public_key: null,
    };

    const result = CheckoutSchema.safeParse(checkout);
    expect(result.success).toBe(true);
  });

  it("should validate checkout with design JSON", () => {
    const checkout = {
      ...createValidCheckout(),
      design: { colors: { primary: "#ff0000" } },
    };

    const result = CheckoutSchema.safeParse(checkout);
    expect(result.success).toBe(true);
  });
});

describe("ResolveAndLoadResponseSchema", () => {
  it("should validate complete response", () => {
    const response = createValidResponse();
    const result = ResolveAndLoadResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with offer", () => {
    const response = {
      ...createValidResponse(),
      data: {
        ...createValidResponse().data,
        offer: {
          offerId: "offer-1",
          offerName: "Promo",
          offerPrice: 4900,
        },
      },
    };

    const result = ResolveAndLoadResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with order bumps", () => {
    const response = {
      ...createValidResponse(),
      data: {
        ...createValidResponse().data,
        orderBumps: [createValidOrderBump()],
      },
    };

    const result = ResolveAndLoadResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should validate response with affiliate", () => {
    const response = {
      ...createValidResponse(),
      data: {
        ...createValidResponse().data,
        affiliate: {
          affiliateId: "aff-1",
          affiliateCode: "CODE",
          affiliateUserId: "user-1",
          commissionRate: 10,
          pixGateway: "pushinpay",
          creditCardGateway: null,
        },
      },
    };

    const result = ResolveAndLoadResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("should reject response without success: true", () => {
    const response = {
      success: false,
      data: createValidResponse().data,
    };

    const result = ResolveAndLoadResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

describe("ErrorResponseSchema", () => {
  it("should validate error response with message", () => {
    const error = {
      success: false,
      error: "Checkout not found",
    };

    const result = ErrorResponseSchema.safeParse(error);
    expect(result.success).toBe(true);
  });

  it("should accept error without success field", () => {
    const error = {
      error: "Something went wrong",
    };

    const result = ErrorResponseSchema.safeParse(error);
    expect(result.success).toBe(true);
  });
});

describe("validateResolveAndLoadResponse", () => {
  it("should return success for valid data", () => {
    const response = createValidResponse();
    const result = validateResolveAndLoadResponse(response);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.checkout.id).toBe("checkout-123");
    }
  });

  it("should return failure for invalid data", () => {
    const invalidResponse = {
      success: true,
      data: {
        checkout: { id: "test" }, // incomplete
        product: null,
        offer: null,
        orderBumps: [],
        affiliate: null,
      },
    };

    const result = validateResolveAndLoadResponse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("should return failure for null input", () => {
    const result = validateResolveAndLoadResponse(null);
    expect(result.success).toBe(false);
  });

  it("should return failure for undefined input", () => {
    const result = validateResolveAndLoadResponse(undefined);
    expect(result.success).toBe(false);
  });

  it("should include error details on failure", () => {
    const result = validateResolveAndLoadResponse({ invalid: true });
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error).toBe("BFF response validation failed");
      expect(result.details).toBeDefined();
    }
  });
});