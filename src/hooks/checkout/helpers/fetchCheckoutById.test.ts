/**
 * fetchCheckoutById Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCheckoutById } from "./fetchCheckoutById";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    publicCall: vi.fn(),
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

describe("fetchCheckoutById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch checkout by ID", async () => {
    const mockCheckout = {
      id: "checkout-123",
      name: "My Checkout",
      slug: "my-checkout",
      visits_count: 100,
      seller_name: "Seller Inc",
      product_id: "product-456",
      font: "Inter",
      components: [],
      top_components: [],
      bottom_components: [],
      status: "active",
      design: { theme: "light" },
      theme: "light",
      pix_gateway: "mercadopago",
      credit_card_gateway: "mercadopago",
      mercadopago_public_key: "mp-key-123",
      stripe_public_key: null,
    };

    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: mockCheckout },
      error: null,
    });

    const result = await fetchCheckoutById("checkout-123");

    expect(api.publicCall).toHaveBeenCalledWith("checkout-public-data", {
      action: "checkout",
      checkoutId: "checkout-123",
    });
    expect(result).toEqual(mockCheckout);
  });

  it("should throw on API error", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Connection failed" },
    });

    await expect(fetchCheckoutById("checkout-123")).rejects.toThrow(
      "Checkout não encontrado"
    );
  });

  it("should throw on invalid response", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: false, error: "Checkout disabled" },
      error: null,
    });

    await expect(fetchCheckoutById("checkout-123")).rejects.toThrow(
      "Checkout disabled"
    );
  });

  it("should throw if checkout not found", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: null },
      error: null,
    });

    await expect(fetchCheckoutById("nonexistent")).rejects.toThrow(
      "Checkout não encontrado"
    );
  });

  it("should return CheckoutRawData interface", async () => {
    const mockCheckout = {
      id: "chk-1",
      name: "Checkout",
      slug: "checkout-slug",
      visits_count: 50,
      seller_name: null,
      product_id: "prod-1",
      font: null,
      components: { rows: [] },
      top_components: null,
      bottom_components: null,
      status: "active",
      design: { colors: { background: "#fff" } },
      theme: "dark",
      pix_gateway: "pushinpay",
      credit_card_gateway: "stripe",
      mercadopago_public_key: null,
      stripe_public_key: "sk-123",
    };

    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: mockCheckout },
      error: null,
    });

    const result = await fetchCheckoutById("chk-1");

    // Verify all expected properties exist
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(result).toHaveProperty("design");
    expect(result).toHaveProperty("pix_gateway");
    expect(result).toHaveProperty("credit_card_gateway");
    expect(result).toHaveProperty("mercadopago_public_key");
    expect(result).toHaveProperty("stripe_public_key");
  });
});
