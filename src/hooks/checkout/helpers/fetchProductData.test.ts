/**
 * fetchProductData Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProductData } from "./fetchProductData";
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

describe("fetchProductData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch product by ID", async () => {
    const mockProduct = {
      id: "product-123",
      user_id: "vendor-456",
      name: "Test Product",
      description: "A test product",
      price: 9900,
      image_url: null,
      support_name: "Support Team",
      required_fields: { cpf: true },
      default_payment_method: "pix",
      upsell_settings: null,
      affiliate_settings: null,
      status: "active",
      pix_gateway: "mercadopago",
      credit_card_gateway: "mercadopago",
    };

    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: mockProduct },
      error: null,
    });

    const result = await fetchProductData("product-123");

    expect(api.publicCall).toHaveBeenCalledWith("checkout-public-data", {
      action: "product",
      productId: "product-123",
    });
    expect(result).toEqual(mockProduct);
  });

  it("should throw on API error", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: null,
      error: { code: "NETWORK_ERROR" as const, message: "Network error" },
    });

    await expect(fetchProductData("product-123")).rejects.toThrow(
      "Produto não encontrado"
    );
  });

  it("should throw on invalid response", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: false, error: "Invalid product" },
      error: null,
    });

    await expect(fetchProductData("product-123")).rejects.toThrow(
      "Invalid product"
    );
  });

  it("should throw if product not found", async () => {
    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: null },
      error: null,
    });

    await expect(fetchProductData("nonexistent")).rejects.toThrow(
      "Produto não encontrado"
    );
  });

  it("should return ProductRawData interface", async () => {
    const mockProduct = {
      id: "prod-1",
      user_id: "user-1",
      name: "Product",
      description: null,
      price: 5000,
      image_url: "https://example.com/img.jpg",
      support_name: null,
      required_fields: ["cpf", "phone"],
      default_payment_method: null,
      upsell_settings: { enabled: true },
      affiliate_settings: { commission: 10 },
      status: "active",
      pix_gateway: "pushinpay",
      credit_card_gateway: "stripe",
    };

    vi.mocked(api.publicCall).mockResolvedValue({
      data: { success: true, data: mockProduct },
      error: null,
    });

    const result = await fetchProductData("prod-1");

    // Verify all expected properties exist
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("user_id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("price");
    expect(result).toHaveProperty("pix_gateway");
    expect(result).toHaveProperty("credit_card_gateway");
  });
});
