/**
 * Offers MSW Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mock handlers for products-crud endpoint (get-offers action).
 * 
 * @module test/mocks/handlers/offers-handlers
 */

import { http, HttpResponse } from "msw";
import { API_GATEWAY_URL } from "@/config/supabase";

// ============================================================================
// Mock Data
// ============================================================================

export const mockOffers = [
  {
    id: "offer-001",
    product_id: "prod-001",
    price: 9990,
    name: "Oferta Básica",
    updated_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "offer-002",
    product_id: "prod-001",
    price: 19990,
    name: "Oferta Premium",
    updated_at: "2026-01-20T00:00:00Z",
  },
  {
    id: "offer-003",
    product_id: "prod-001",
    price: 0,
    name: "Oferta Gratuita",
    updated_at: "2026-01-25T00:00:00Z",
  },
];

export const mockOffersWithNulls = [
  {
    id: "offer-null-001",
    product_id: "prod-002",
    price: 5990,
    name: null,
    updated_at: null,
  },
];

// ============================================================================
// Request Body Types
// ============================================================================

interface ProductsCrudBody {
  action: string;
  productId?: string;
}

// ============================================================================
// Handlers
// ============================================================================

export const offersHandlers = [
  http.post(`${API_GATEWAY_URL}/functions/v1/products-crud`, async ({ request }) => {
    const body = await request.json() as ProductsCrudBody;

    if (body.action === "get-offers") {
      if (!body.productId) {
        return HttpResponse.json({ error: "productId required" }, { status: 400 });
      }

      // Return different mocks based on productId
      if (body.productId === "prod-001") {
        return HttpResponse.json({ offers: mockOffers });
      }

      if (body.productId === "prod-002") {
        return HttpResponse.json({ offers: mockOffersWithNulls });
      }

      if (body.productId === "prod-empty") {
        return HttpResponse.json({ offers: [] });
      }

      if (body.productId === "prod-error") {
        return HttpResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Default: return empty offers for unknown products
      return HttpResponse.json({ offers: [] });
    }

    // Let other handlers deal with non-get-offers actions
    return HttpResponse.json({ error: "Unhandled action" }, { status: 400 });
  }),
];
