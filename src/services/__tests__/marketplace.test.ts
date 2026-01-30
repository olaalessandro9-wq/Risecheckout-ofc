/**
 * Marketplace Service Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for marketplace.ts service functions:
 * - fetchMarketplaceProducts
 * - fetchProductDetails
 * - fetchMarketplaceCategories
 * - trackProductView
 * - trackProductClick
 * - checkAffiliationStatus
 * 
 * @module services/__tests__/marketplace.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { API_GATEWAY_URL } from "@/config/supabase";
import {
  fetchMarketplaceProducts,
  fetchProductDetails,
  fetchMarketplaceCategories,
  trackProductView,
  trackProductClick,
  checkAffiliationStatus,
} from "../marketplace";
import {
  mockMarketplaceProducts,
  mockMarketplaceCategories,
  mockAffiliationStatusResponse,
} from "@/test/mocks/handlers/marketplace-handlers";

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// fetchMarketplaceProducts Tests
// ============================================================================

describe("fetchMarketplaceProducts", () => {
  it("should fetch products with default filters", async () => {
    const result = await fetchMarketplaceProducts();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("mp-prod-001");
    expect(result[0].name).toBe("Curso de Marketing Digital");
  });

  it("should pass filters to API correctly", async () => {
    let capturedFilters: Record<string, unknown> | undefined;

    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, async ({ request }) => {
        const body = await request.json() as { filters?: Record<string, unknown> };
        capturedFilters = body.filters;
        return HttpResponse.json({ products: mockMarketplaceProducts });
      })
    );

    await fetchMarketplaceProducts({
      category: "marketing",
      search: "curso",
      minCommission: 20,
      maxCommission: 50,
      sortBy: "popular",
      limit: 10,
      offset: 0,
    });

    expect(capturedFilters).toEqual({
      category: "marketing",
      search: "curso",
      minCommission: 20,
      maxCommission: 50,
      sortBy: "popular",
      limit: 10,
      offset: 0,
    });
  });

  it("should return empty array when no products", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.json({ products: [] });
      })
    );

    const result = await fetchMarketplaceProducts();
    expect(result).toEqual([]);
  });

  it("should throw on API error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );

    await expect(fetchMarketplaceProducts()).rejects.toThrow();
  });

  it("should throw on network error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.error();
      })
    );

    await expect(fetchMarketplaceProducts()).rejects.toThrow();
  });
});

// ============================================================================
// fetchProductDetails Tests
// ============================================================================

describe("fetchProductDetails", () => {
  it("should fetch product by ID", async () => {
    const result = await fetchProductDetails("mp-prod-001");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("mp-prod-001");
    expect(result?.name).toBe("Curso de Marketing Digital");
    expect(result?.category_info?.name).toBe("Marketing Digital");
  });

  it("should return null when product not found", async () => {
    const result = await fetchProductDetails("non-existent");
    expect(result).toBeNull();
  });

  it("should throw on API error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.json({ error: "Database error" }, { status: 500 });
      })
    );

    await expect(fetchProductDetails("mp-prod-001")).rejects.toThrow();
  });
});

// ============================================================================
// fetchMarketplaceCategories Tests
// ============================================================================

describe("fetchMarketplaceCategories", () => {
  it("should fetch all categories", async () => {
    const result = await fetchMarketplaceCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Marketing Digital");
    expect(result[1].name).toBe("Desenvolvimento");
  });

  it("should return empty array when no categories", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.json({ categories: [] });
      })
    );

    const result = await fetchMarketplaceCategories();
    expect(result).toEqual([]);
  });

  it("should throw on API error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/marketplace-public`, () => {
        return HttpResponse.json({ error: "Service unavailable" }, { status: 503 });
      })
    );

    await expect(fetchMarketplaceCategories()).rejects.toThrow();
  });
});

// ============================================================================
// trackProductView Tests
// ============================================================================

describe("trackProductView", () => {
  it("should call increment RPC", async () => {
    let called = false;

    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/rpc-proxy`, async ({ request }) => {
        const body = await request.json() as { rpc: string };
        if (body.rpc === "increment_marketplace_view") {
          called = true;
        }
        return HttpResponse.json({ data: null });
      })
    );

    await trackProductView("mp-prod-001");
    expect(called).toBe(true);
  });

  it("should not throw on error (silent fail)", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/rpc-proxy`, () => {
        return HttpResponse.json({ error: "RPC failed" }, { status: 500 });
      })
    );

    // Should not throw
    await expect(trackProductView("mp-prod-001")).resolves.toBeUndefined();
  });
});

// ============================================================================
// trackProductClick Tests
// ============================================================================

describe("trackProductClick", () => {
  it("should call increment RPC", async () => {
    let called = false;

    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/rpc-proxy`, async ({ request }) => {
        const body = await request.json() as { rpc: string };
        if (body.rpc === "increment_marketplace_click") {
          called = true;
        }
        return HttpResponse.json({ data: null });
      })
    );

    await trackProductClick("mp-prod-001");
    expect(called).toBe(true);
  });

  it("should not throw on error (silent fail)", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/rpc-proxy`, () => {
        return HttpResponse.error();
      })
    );

    // Should not throw
    await expect(trackProductClick("mp-prod-001")).resolves.toBeUndefined();
  });
});

// ============================================================================
// checkAffiliationStatus Tests
// ============================================================================

describe("checkAffiliationStatus", () => {
  it("should return affiliate status when authenticated", async () => {
    const result = await checkAffiliationStatus("mp-prod-001");

    expect(result.isAffiliate).toBe(true);
    expect(result.status).toBe("active");
    expect(result.affiliationId).toBe("aff-001");
  });

  it("should return isAffiliate: false on UNAUTHORIZED", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/get-affiliation-status`, () => {
        return HttpResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized" },
          { status: 401 }
        );
      })
    );

    const result = await checkAffiliationStatus("mp-prod-001");
    expect(result.isAffiliate).toBe(false);
  });

  it("should return isAffiliate: false on error", async () => {
    server.use(
      http.post(`${API_GATEWAY_URL}/functions/v1/get-affiliation-status`, () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );

    const result = await checkAffiliationStatus("mp-prod-001");
    expect(result.isAffiliate).toBe(false);
  });
});
