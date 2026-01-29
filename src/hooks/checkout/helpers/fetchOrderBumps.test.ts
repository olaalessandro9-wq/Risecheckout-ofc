/**
 * fetchOrderBumps Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOrderBumps } from "./fetchOrderBumps";
import { publicApi } from "@/lib/api/public-client";

vi.mock("@/lib/api/public-client", () => ({
  publicApi: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("fetchOrderBumps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch order bumps by checkoutId", async () => {
    const mockBumps = [
      {
        id: "bump-1",
        product_id: "prod-1",
        name: "Bonus Item",
        description: "Extra content",
        price: 2000,
        original_price: 5000,
        image_url: null,
        call_to_action: "Add this!",
        product: null,
        offer: null,
      },
    ];

    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: true, data: mockBumps },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(publicApi.call).toHaveBeenCalledWith("checkout-public-data", {
      action: "order-bumps",
      checkoutId: "checkout-123",
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bonus Item");
  });

  it("should return empty array on error", async () => {
    vi.mocked(publicApi.call).mockResolvedValue({
      data: null,
      error: { code: "INTERNAL_ERROR" as const, message: "Server error" },
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(result).toEqual([]);
  });

  it("should return empty array on invalid response", async () => {
    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: false },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(result).toEqual([]);
  });

  it("should format bumps correctly", async () => {
    const mockBumps = [
      {
        id: "bump-1",
        product_id: "prod-1",
        name: "Item 1",
        description: "Desc 1",
        price: 1500,
        original_price: 3000,
        image_url: "https://example.com/img.jpg",
        call_to_action: "Buy now!",
        product: {
          id: "prod-1",
          name: "Product 1",
          description: "Product desc",
          price: 10000,
          image_url: null,
        },
        offer: {
          id: "offer-1",
          name: "Special Offer",
          price: 1500,
        },
      },
    ];

    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: true, data: mockBumps },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(result[0]).toHaveProperty("id", "bump-1");
    expect(result[0]).toHaveProperty("price", 1500);
    expect(result[0]).toHaveProperty("original_price", 3000);
    expect(result[0]).toHaveProperty("call_to_action", "Buy now!");
  });

  it("should preserve price semantics", async () => {
    // price = REAL price to charge
    // original_price = MARKETING strikethrough price
    const mockBumps = [
      {
        id: "bump-1",
        product_id: "prod-1",
        name: "Discounted Item",
        description: "",
        price: 1000, // What customer pays
        original_price: 2500, // For display only
        image_url: null,
        call_to_action: null,
        product: null,
        offer: null,
      },
    ];

    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: true, data: mockBumps },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    // price is the billing amount
    expect(result[0].price).toBe(1000);
    // original_price is for strikethrough display
    expect(result[0].original_price).toBe(2500);
  });

  it("should handle missing offer", async () => {
    const mockBumps = [
      {
        id: "bump-1",
        product_id: "prod-1",
        name: "Simple Bump",
        description: "",
        price: 500,
        original_price: null,
        image_url: null,
        call_to_action: null,
        product: null,
        offer: null, // No offer
      },
    ];

    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: true, data: mockBumps },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(result[0].offer).toBeNull();
    expect(result[0].price).toBe(500);
  });

  it("should return empty array when data is undefined", async () => {
    vi.mocked(publicApi.call).mockResolvedValue({
      data: { success: true, data: undefined },
      error: null,
    });

    const result = await fetchOrderBumps("checkout-123");

    expect(result).toEqual([]);
  });
});
