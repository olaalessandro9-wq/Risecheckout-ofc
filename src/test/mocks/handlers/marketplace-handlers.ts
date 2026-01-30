/**
 * Marketplace MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for marketplace-public, get-affiliation-status, and rpc-proxy endpoints.
 * 
 * @module test/mocks/handlers/marketplace-handlers
 */

import { http, HttpResponse } from "msw";
import { API_GATEWAY_URL } from "@/config/supabase";

// ============================================================================
// Mock Data
// ============================================================================

export const mockMarketplaceProducts = [
  {
    id: "mp-prod-001",
    name: "Curso de Marketing Digital",
    description: "Aprenda marketing digital do zero",
    price: 19990,
    commission_rate: 30,
    status: "active",
    category_id: "cat-001",
    image_url: "https://example.com/image1.jpg",
    views_count: 1500,
    clicks_count: 300,
    sales_count: 45,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    category_info: {
      id: "cat-001",
      name: "Marketing Digital",
      slug: "marketing-digital",
      description: "Cursos de marketing",
      icon: "📈",
      display_order: 1,
      created_at: "2026-01-01T00:00:00Z",
    },
  },
  {
    id: "mp-prod-002",
    name: "Ebook Vendas Online",
    description: "Guia completo de vendas",
    price: 4990,
    commission_rate: 50,
    status: "active",
    category_id: "cat-002",
    image_url: "https://example.com/image2.jpg",
    views_count: 800,
    clicks_count: 150,
    sales_count: 120,
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    category_info: null,
  },
];

export const mockMarketplaceCategories = [
  {
    id: "cat-001",
    name: "Marketing Digital",
    slug: "marketing-digital",
    description: "Cursos de marketing",
    icon: "📈",
    display_order: 1,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-002",
    name: "Desenvolvimento",
    slug: "desenvolvimento",
    description: "Cursos de programação",
    icon: "💻",
    display_order: 2,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const mockAffiliationStatusResponse = {
  isAffiliate: true,
  status: "active" as const,
  affiliationId: "aff-001",
};

// ============================================================================
// Request Body Types
// ============================================================================

interface MarketplacePublicBody {
  action: "get-products" | "get-product" | "get-categories";
  filters?: Record<string, unknown>;
  productId?: string;
}

interface AffiliationStatusBody {
  product_id: string;
}

interface RpcProxyBody {
  rpc: string;
  params?: Record<string, unknown>;
}

// ============================================================================
// Handlers
// ============================================================================

export const marketplaceHandlers = [
  // marketplace-public endpoint
  http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, async ({ request }) => {
    const body = await request.json() as MarketplacePublicBody;

    switch (body.action) {
      case "get-products":
        return HttpResponse.json({ products: mockMarketplaceProducts });

      case "get-product":
        if (!body.productId) {
          return HttpResponse.json({ error: "productId required" }, { status: 400 });
        }
        const product = mockMarketplaceProducts.find((p) => p.id === body.productId);
        return HttpResponse.json({ product: product || null });

      case "get-categories":
        return HttpResponse.json({ categories: mockMarketplaceCategories });

      default:
        return HttpResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  }),

  // get-affiliation-status endpoint (authenticated)
  http.post(`${API_GATEWAY_URL}/functions/v1/get-affiliation-status`, async ({ request }) => {
    const body = await request.json() as AffiliationStatusBody;

    if (!body.product_id) {
      return HttpResponse.json({ error: "product_id required" }, { status: 400 });
    }

    return HttpResponse.json(mockAffiliationStatusResponse);
  }),

  // rpc-proxy for tracking (increment_marketplace_view/click)
  http.post(`${API_GATEWAY_URL}/functions/v1/rpc-proxy`, async ({ request }) => {
    const body = await request.json() as RpcProxyBody;

    if (body.rpc === "increment_marketplace_view" || body.rpc === "increment_marketplace_click") {
      return HttpResponse.json({ data: null });
    }

    return HttpResponse.json({ error: "Unknown RPC" }, { status: 400 });
  }),
];
