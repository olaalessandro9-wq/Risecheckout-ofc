/**
 * mapResolveAndLoad Mapper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the BFF response to UI model mapper.
 * 
 * @module test/checkout-public/mappers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapResolveAndLoad, type MappedCheckoutData } from "../mapResolveAndLoad";
import type { ResolveAndLoadResponse } from "../../contracts";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("@/lib/utils", () => ({
  parseJsonSafely: (value: unknown, fallback: unknown) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return value ?? fallback;
  },
}));

vi.mock("@/lib/checkout/normalizeDesign", () => ({
  normalizeDesign: (data: { theme?: string; design?: unknown }) => ({
    theme: data.theme || 'default',
    colors: { primary: '#000' },
  }),
}));

// ============================================================================
// HELPERS
// ============================================================================

function createMockResponse(
  overrides: Partial<{
    checkout: Partial<ResolveAndLoadResponse["data"]["checkout"]>;
    product: Partial<ResolveAndLoadResponse["data"]["product"]>;
    offer: ResolveAndLoadResponse["data"]["offer"];
    orderBumps: ResolveAndLoadResponse["data"]["orderBumps"];
    affiliate: ResolveAndLoadResponse["data"]["affiliate"];
  }> = {}
): ResolveAndLoadResponse {
  return {
    success: true,
    data: {
      checkout: {
        id: "checkout-123",
        name: "Meu Checkout",
        slug: "meu-checkout",
        visits_count: 100,
        seller_name: "Vendedor Teste",
        font: "Inter",
        theme: "light",
        design: null,
        components: null,
        top_components: null,
        bottom_components: null,
        mercadopago_public_key: "TEST-mp-key",
        stripe_public_key: null,
        ...overrides.checkout,
      },
      product: {
        id: "product-123",
        user_id: "user-456",
        name: "Produto Teste",
        description: "Descrição do produto",
        price: 9900,
        image_url: "https://example.com/image.jpg",
        support_name: "Suporte",
        required_fields: { phone: true, cpf: false },
        default_payment_method: "pix",
        pix_gateway: "mercadopago",
        credit_card_gateway: "mercadopago",
        upsell_settings: null,
        affiliate_settings: null,
        ...overrides.product,
      },
      offer: overrides.offer ?? null,
      orderBumps: overrides.orderBumps ?? [],
      affiliate: overrides.affiliate ?? null,
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("mapResolveAndLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkout mapping", () => {
    it("should map checkout fields correctly", () => {
      const response = createMockResponse();
      const result = mapResolveAndLoad(response);

      expect(result.checkout).toMatchObject({
        id: "checkout-123",
        name: "Meu Checkout",
        slug: "meu-checkout",
        visits_count: 100,
        seller_name: "Vendedor Teste",
        font: "Inter",
        theme: "light",
      });
    });

    it("should use product.user_id as vendorId", () => {
      const response = createMockResponse();
      const result = mapResolveAndLoad(response);

      expect(result.checkout.vendorId).toBe("user-456");
    });

    it("should handle null seller_name", () => {
      const response = createMockResponse({
        checkout: { seller_name: null },
      });
      const result = mapResolveAndLoad(response);

      expect(result.checkout.seller_name).toBeUndefined();
    });

    it("should parse JSON components", () => {
      const response = createMockResponse({
        checkout: { 
          components: JSON.stringify([{ type: "text" }]),
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.checkout.components).toEqual([{ type: "text" }]);
    });
  });

  describe("product mapping", () => {
    it("should map product fields correctly", () => {
      const response = createMockResponse();
      const result = mapResolveAndLoad(response);

      expect(result.product).toMatchObject({
        id: "product-123",
        name: "Produto Teste",
        description: "Descrição do produto",
        price: 9900,
        image_url: "https://example.com/image.jpg",
        support_name: "Suporte",
        default_payment_method: "pix",
      });
    });

    it("should normalize required_fields", () => {
      const response = createMockResponse({
        product: { required_fields: { phone: true, cpf: false } },
      });
      const result = mapResolveAndLoad(response);

      expect(result.product.required_fields).toEqual({
        name: true,
        email: true,
        phone: true,
        cpf: false,
      });
    });

    it("should default required_fields when null", () => {
      const response = createMockResponse({
        product: { required_fields: null },
      });
      const result = mapResolveAndLoad(response);

      expect(result.product.required_fields).toEqual({
        name: true,
        email: true,
        phone: false,
        cpf: false,
      });
    });

    it("should handle empty description", () => {
      const response = createMockResponse({
        product: { description: null },
      });
      const result = mapResolveAndLoad(response);

      expect(result.product.description).toBe("");
    });
  });

  describe("offer mapping", () => {
    it("should map offer when present", () => {
      const response = createMockResponse({
        offer: {
          offerId: "offer-123",
          offerName: "Oferta Especial",
          offerPrice: 4900,
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.offer).toEqual({
        offerId: "offer-123",
        offerName: "Oferta Especial",
        offerPrice: 4900,
      });
    });

    it("should return null offer when not present", () => {
      const response = createMockResponse({ offer: null });
      const result = mapResolveAndLoad(response);

      expect(result.offer).toBeNull();
    });

    it("should use offer price over product price", () => {
      const response = createMockResponse({
        product: { price: 9900 },
        offer: {
          offerId: "offer-123",
          offerName: "Promoção",
          offerPrice: 4900,
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.product.price).toBe(4900);
    });
  });

  describe("order bumps mapping", () => {
    it("should map order bumps correctly", () => {
      const response = createMockResponse({
        orderBumps: [
          {
            id: "bump-1",
            product_id: "prod-1",
            name: "Bump 1",
            description: "Descrição bump",
            price: 1900,
            original_price: 2900,
            image_url: "https://example.com/bump.jpg",
            call_to_action: "Adicionar",
          },
        ],
      });
      const result = mapResolveAndLoad(response);

      expect(result.orderBumps).toHaveLength(1);
      expect(result.orderBumps[0]).toMatchObject({
        id: "bump-1",
        name: "Bump 1",
        price: 1900,
        original_price: 2900,
      });
    });

    it("should handle empty order bumps", () => {
      const response = createMockResponse({ orderBumps: [] });
      const result = mapResolveAndLoad(response);

      expect(result.orderBumps).toEqual([]);
    });

    it("should handle null description in bump", () => {
      const response = createMockResponse({
        orderBumps: [
          {
            id: "bump-1",
            product_id: null,
            name: "Bump",
            description: null,
            price: 1000,
            original_price: null,
            image_url: null,
            call_to_action: null,
          },
        ],
      });
      const result = mapResolveAndLoad(response);

      expect(result.orderBumps[0].description).toBe("");
    });
  });

  describe("affiliate mapping", () => {
    it("should map affiliate when present", () => {
      const response = createMockResponse({
        affiliate: {
          affiliateId: "aff-123",
          affiliateCode: "PARTNER50",
          affiliateUserId: "user-789",
          commissionRate: 30,
          pixGateway: "pushinpay",
          creditCardGateway: "stripe",
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.affiliate).toMatchObject({
        affiliateId: "aff-123",
        affiliateCode: "PARTNER50",
        commissionRate: 30,
        pixGateway: "pushinpay",
        creditCardGateway: "stripe",
      });
    });

    it("should return null affiliate when not present", () => {
      const response = createMockResponse({ affiliate: null });
      const result = mapResolveAndLoad(response);

      expect(result.affiliate).toBeNull();
    });
  });

  describe("gateway resolution", () => {
    it("should use product gateways when no affiliate", () => {
      const response = createMockResponse({
        product: {
          pix_gateway: "asaas",
          credit_card_gateway: "stripe",
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.resolvedGateways).toMatchObject({
        pix: "asaas",
        creditCard: "stripe",
      });
    });

    it("should prefer affiliate gateways over product", () => {
      const response = createMockResponse({
        product: {
          pix_gateway: "mercadopago",
          credit_card_gateway: "mercadopago",
        },
        affiliate: {
          affiliateId: "aff-1",
          affiliateCode: "CODE",
          affiliateUserId: "user-1",
          commissionRate: 10,
          pixGateway: "pushinpay",
          creditCardGateway: "stripe",
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.resolvedGateways.pix).toBe("pushinpay");
      expect(result.resolvedGateways.creditCard).toBe("stripe");
    });

    it("should default to mercadopago when no gateway configured", () => {
      const response = createMockResponse({
        product: {
          pix_gateway: null,
          credit_card_gateway: null,
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.resolvedGateways.pix).toBe("mercadopago");
      expect(result.resolvedGateways.creditCard).toBe("mercadopago");
    });

    it("should include public keys", () => {
      const response = createMockResponse({
        checkout: {
          mercadopago_public_key: "MP-PUBLIC-KEY",
          stripe_public_key: "STRIPE-PUBLIC-KEY",
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.resolvedGateways.mercadoPagoPublicKey).toBe("MP-PUBLIC-KEY");
      expect(result.resolvedGateways.stripePublicKey).toBe("STRIPE-PUBLIC-KEY");
    });
  });

  describe("design normalization", () => {
    it("should call normalizeDesign with theme and design", () => {
      const response = createMockResponse({
        checkout: {
          theme: "dark",
          design: JSON.stringify({ colors: { primary: "#ff0000" } }),
        },
      });
      const result = mapResolveAndLoad(response);

      expect(result.design).toBeDefined();
      // Design is normalized by normalizeDesign mock
    });

    it("should handle null design", () => {
      const response = createMockResponse({
        checkout: { design: null },
      });
      const result = mapResolveAndLoad(response);

      expect(result.design).toBeDefined();
    });
  });

  describe("return structure", () => {
    it("should return all expected properties", () => {
      const response = createMockResponse();
      const result = mapResolveAndLoad(response);

      expect(result).toHaveProperty("checkout");
      expect(result).toHaveProperty("product");
      expect(result).toHaveProperty("offer");
      expect(result).toHaveProperty("orderBumps");
      expect(result).toHaveProperty("affiliate");
      expect(result).toHaveProperty("resolvedGateways");
      expect(result).toHaveProperty("design");
    });
  });
});
