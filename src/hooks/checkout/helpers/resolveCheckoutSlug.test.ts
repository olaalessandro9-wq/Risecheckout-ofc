/**
 * resolveCheckoutSlug Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveCheckoutSlug } from "./resolveCheckoutSlug";
import { getCheckoutBySlugRpc } from "@/lib/rpc/rpcProxy";

vi.mock("@/lib/rpc/rpcProxy", () => ({
  getCheckoutBySlugRpc: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("resolveCheckoutSlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve slug to checkoutId and productId", async () => {
    vi.mocked(getCheckoutBySlugRpc).mockResolvedValue({
      data: [
        {
          checkout_id: "checkout-123",
          product_id: "product-456",
        },
      ],
      error: null,
    });

    const result = await resolveCheckoutSlug("my-checkout-slug");

    expect(getCheckoutBySlugRpc).toHaveBeenCalledWith("my-checkout-slug");
    expect(result).toEqual({
      checkoutId: "checkout-123",
      productId: "product-456",
    });
  });

  it("should throw on RPC error", async () => {
    vi.mocked(getCheckoutBySlugRpc).mockResolvedValue({
      data: null,
      error: { name: "Error", message: "Database error" },
    });

    await expect(resolveCheckoutSlug("bad-slug")).rejects.toThrow(
      "Checkout não encontrado via RPC"
    );
  });

  it("should throw on empty data", async () => {
    vi.mocked(getCheckoutBySlugRpc).mockResolvedValue({
      data: [],
      error: null,
    });

    await expect(resolveCheckoutSlug("nonexistent")).rejects.toThrow(
      "Checkout não encontrado via RPC"
    );
  });

  it("should throw on missing checkout_id", async () => {
    vi.mocked(getCheckoutBySlugRpc).mockResolvedValue({
      data: [
        {
          checkout_id: null,
          product_id: "product-123",
        },
      ],
      error: null,
    });

    await expect(resolveCheckoutSlug("invalid-slug")).rejects.toThrow(
      "Checkout não encontrado via RPC"
    );
  });

  it("should handle special characters in slug", async () => {
    vi.mocked(getCheckoutBySlugRpc).mockResolvedValue({
      data: [
        {
          checkout_id: "checkout-abc",
          product_id: "product-xyz",
        },
      ],
      error: null,
    });

    const result = await resolveCheckoutSlug("my-special_slug-123");

    expect(getCheckoutBySlugRpc).toHaveBeenCalledWith("my-special_slug-123");
    expect(result.checkoutId).toBe("checkout-abc");
  });
});
