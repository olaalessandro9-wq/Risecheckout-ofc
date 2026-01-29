/**
 * Products API MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for products-api edge function.
 * Provides CRUD operations and settings management.
 * 
 * @module test/mocks/handlers/products-handlers
 */

import { http, HttpResponse } from "msw";

// ============================================================================
// Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";

// ============================================================================
// Mock Data
// ============================================================================

export const mockProducts = [
  {
    id: "prod-001",
    name: "Product Alpha",
    description: "First test product",
    price: 9990, // R$ 99,90
    status: "active" as const,
    image_url: "https://example.com/alpha.jpg",
    slug: "product-alpha",
    vendor_id: "vendor-001",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    delivery_type: "digital",
    support_email: "support@example.com",
    marketplace_enabled: true,
    marketplace_commission_rate: 10,
  },
  {
    id: "prod-002",
    name: "Product Beta",
    description: "Second test product",
    price: 19990, // R$ 199,90
    status: "active" as const,
    image_url: "https://example.com/beta.jpg",
    slug: "product-beta",
    vendor_id: "vendor-001",
    created_at: "2026-01-05T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    delivery_type: "digital",
    support_email: "support@example.com",
    marketplace_enabled: false,
    marketplace_commission_rate: 0,
  },
  {
    id: "prod-003",
    name: "Product Gamma",
    description: "Third test product",
    price: 4990, // R$ 49,90
    status: "draft" as const,
    image_url: null,
    slug: "product-gamma",
    vendor_id: "vendor-001",
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-25T00:00:00Z",
    delivery_type: "physical",
    support_email: null,
    marketplace_enabled: false,
    marketplace_commission_rate: 0,
  },
];

export const mockProductSettings = {
  product_id: "prod-001",
  marketplace_enabled: true,
  marketplace_commission_rate: 10,
  affiliate_enabled: true,
  affiliate_commission_rate: 20,
};

// ============================================================================
// Request Body Types
// ============================================================================

interface ProductsRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "get_settings" | "update_settings";
  params?: {
    productId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    name?: string;
    description?: string;
    price?: number;
    settings?: Record<string, unknown>;
  };
}

// ============================================================================
// Handlers
// ============================================================================

export const productsHandlers = [
  http.post(`${API_URL}/products-api`, async ({ request }) => {
    const body = (await request.json()) as ProductsRequest;

    switch (body.action) {
      case "list": {
        const page = body.params?.page ?? 1;
        const pageSize = body.params?.pageSize ?? 10;
        const search = body.params?.search?.toLowerCase();
        const status = body.params?.status;

        let filteredProducts = [...mockProducts];

        if (search) {
          filteredProducts = filteredProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.description?.toLowerCase().includes(search)
          );
        }

        if (status) {
          filteredProducts = filteredProducts.filter((p) => p.status === status);
        }

        const total = filteredProducts.length;
        const startIndex = (page - 1) * pageSize;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

        return HttpResponse.json({
          data: {
            data: paginatedProducts,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
          error: null,
        });
      }

      case "get": {
        const product = mockProducts.find((p) => p.id === body.params?.productId);

        if (!product) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: product,
          error: null,
        });
      }

      case "create": {
        if (!body.params?.name || body.params?.price === undefined) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Name and price are required" },
            },
            { status: 400 }
          );
        }

        const newId = `prod-${Date.now()}`;
        return HttpResponse.json({
          data: {
            success: true,
            id: newId,
          },
          error: null,
        });
      }

      case "update": {
        if (!body.params?.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        const existingProduct = mockProducts.find((p) => p.id === body.params?.productId);
        if (!existingProduct) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: {
            success: true,
            id: body.params.productId,
          },
          error: null,
        });
      }

      case "delete": {
        if (!body.params?.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        const productToDelete = mockProducts.find((p) => p.id === body.params?.productId);
        if (!productToDelete) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: {
            success: true,
            id: body.params.productId,
          },
          error: null,
        });
      }

      case "get_settings": {
        if (!body.params?.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        if (body.params.productId === "not-found") {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Settings not found" },
            },
            { status: 404 }
          );
        }

        return HttpResponse.json({
          data: {
            ...mockProductSettings,
            product_id: body.params.productId,
          },
          error: null,
        });
      }

      case "update_settings": {
        if (!body.params?.productId) {
          return HttpResponse.json(
            {
              data: null,
              error: { message: "Product ID is required" },
            },
            { status: 400 }
          );
        }

        return HttpResponse.json({
          data: {
            success: true,
            id: body.params.productId,
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
];
