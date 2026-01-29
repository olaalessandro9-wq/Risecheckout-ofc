/**
 * Checkout Public API MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for checkout-public-data and admin-data edge functions.
 * Used by checkout helpers: fetchProductData, fetchOrderBumps, fetchCheckoutById, etc.
 * 
 * @module test/mocks/handlers/checkout-public-handlers
 */

import { http, HttpResponse } from "msw";

// ============================================================================
// Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// Mock Data
// ============================================================================

export const mockPublicProduct = {
  id: "prod-public-001",
  name: "Public Test Product",
  description: "A product for public checkout",
  price: 9990, // R$ 99,90
  status: "active",
  image_url: "https://example.com/product.jpg",
  slug: "public-test-product",
  vendor_id: "vendor-001",
  delivery_type: "digital",
  support_email: "support@example.com",
  max_installments: 12,
  pix_enabled: true,
  card_enabled: true,
  boleto_enabled: false,
};

export const mockPublicCheckout = {
  id: "checkout-public-001",
  name: "Public Test Checkout",
  product_id: "prod-public-001",
  status: "active",
  slug: "test-checkout",
  theme: "light",
  design: {
    colors: {
      primary: "#4F46E5",
      background: "#FFFFFF",
      text: "#1F2937",
    },
  },
  credit_card_gateway: "mercadopago",
  pix_gateway: "mercadopago",
  mercadopago_public_key: "TEST-public-key-123",
};

export const mockOrderBumps = [
  {
    id: "bump-001",
    name: "Order Bump 1",
    description: "Extra value offer",
    price: 2990, // R$ 29,90
    original_price: 4990,
    active: true,
    display_order: 1,
    offer: {
      id: "offer-001",
      product_id: "prod-bump-001",
      name: "Bump Product 1",
    },
  },
  {
    id: "bump-002",
    name: "Order Bump 2",
    description: "Premium upgrade",
    price: 4990, // R$ 49,90
    original_price: 7990,
    active: true,
    display_order: 2,
    offer: {
      id: "offer-002",
      product_id: "prod-bump-002",
      name: "Bump Product 2",
    },
  },
];

export const mockAffiliateInfo = {
  affiliateId: "aff-001",
  affiliateCode: "PARTNER123",
  commissionRate: 20,
  creditCardGateway: "stripe",
  pixGateway: "mercadopago",
  gatewayCredentials: {
    stripe_public_key: "pk_test_affiliate_123",
    mercadopago_public_key: "TEST-aff-key-456",
  },
};

export const mockResolveSlugResponse = {
  checkout_id: "checkout-public-001",
  product_id: "prod-public-001",
};

// ============================================================================
// Request Body Types
// ============================================================================

interface CheckoutPublicRequest {
  action: "product" | "checkout" | "order-bumps" | "offer" | "resolve-and-load";
  productId?: string;
  checkoutId?: string;
  slug?: string;
  affiliateCode?: string;
}

interface AdminDataRequest {
  action: string;
  productId?: string;
  baseName?: string;
  productName?: string;
}

// ============================================================================
// Handlers
// ============================================================================

export const checkoutPublicHandlers = [
  // Checkout Public Data Handler
  http.post(`${API_URL}/checkout-public-data`, async ({ request }) => {
    const body = (await request.json()) as CheckoutPublicRequest;

    switch (body.action) {
      case "product": {
        if (!body.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        if (body.productId === "not-found") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: mockPublicProduct,
          error: null,
        });
      }

      case "checkout": {
        if (!body.checkoutId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Checkout ID is required" },
            },
            { status: 400 }
          );
        }

        if (body.checkoutId === "not-found") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Checkout not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: mockPublicCheckout,
          error: null,
        });
      }

      case "order-bumps": {
        if (!body.checkoutId) {
          return HttpResponse.json({
            data: [],
            error: null,
          });
        }

        if (body.checkoutId === "empty-bumps") {
          return HttpResponse.json({
            data: [],
            error: null,
          });
        }

        if (body.checkoutId === "error") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Failed to fetch order bumps" },
            },
            { status: 500 }
          );
        }

        return HttpResponse.json({
          data: mockOrderBumps,
          error: null,
        });
      }

      case "offer": {
        return HttpResponse.json({
          data: mockOrderBumps[0]?.offer ?? null,
          error: null,
        });
      }

      case "resolve-and-load": {
        if (!body.slug) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Slug is required" },
            },
            { status: 400 }
          );
        }

        if (body.slug === "not-found") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Checkout not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: {
            checkout: mockPublicCheckout,
            product: mockPublicProduct,
            orderBumps: mockOrderBumps,
          },
          error: null,
        });
      }

      default:
        return HttpResponse.json(
          {
            data: null,
            error: { message: `Unknown action: ${body.action}` },
          },
          { status: 400 }
        );
    }
  }),

  // Admin Data Handler (for unique name checks)
  http.post(`${API_URL}/admin-data`, async ({ request }) => {
    const body = (await request.json()) as AdminDataRequest;

    switch (body.action) {
      case "check-unique-name": {
        if (!body.productName) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product name is required" },
            },
            { status: 400 }
          );
        }

        // Simulate generating unique name
        const baseName = body.productName;
        const uniqueName = baseName.includes("Existing")
          ? `${baseName} (2)`
          : baseName;

        return HttpResponse.json({
          data: {
            success: true,
            uniqueName,
          },
          error: null,
        });
      }

      case "check-unique-checkout-name": {
        if (!body.productId || !body.baseName) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID and base name are required" },
            },
            { status: 400 }
          );
        }

        // Simulate generating unique checkout name
        const baseName = body.baseName;
        const uniqueName = baseName.includes("Existing")
          ? `${baseName} (2)`
          : baseName;

        return HttpResponse.json({
          data: {
            success: true,
            uniqueName,
          },
          error: null,
        });
      }

      default:
        return HttpResponse.json(
          {
            data: null,
            error: { message: `Unknown action: ${body.action}` },
          },
          { status: 400 }
        );
    }
  }),

  // RPC Handler for resolve_checkout_slug
  http.post(`${API_URL}/rest/v1/rpc/resolve_checkout_slug`, async ({ request }) => {
    const body = (await request.json()) as { p_slug: string };

    if (!body.p_slug) {
      return HttpResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    if (body.p_slug === "not-found") {
      return HttpResponse.json([]);
    }

    return HttpResponse.json([mockResolveSlugResponse]);
  }),

  // RPC Handler for get_affiliate_info
  http.post(`${API_URL}/rest/v1/rpc/get_affiliate_info`, async ({ request }) => {
    const body = (await request.json()) as { p_affiliate_code: string };

    if (!body.p_affiliate_code) {
      return HttpResponse.json([]);
    }

    if (body.p_affiliate_code === "INVALID") {
      return HttpResponse.json([]);
    }

    return HttpResponse.json([mockAffiliateInfo]);
  }),
];
