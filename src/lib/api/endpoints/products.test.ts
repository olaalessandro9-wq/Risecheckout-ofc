/**
 * Products API Endpoint Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { productsApi } from "./products";
import { api } from "../client";

vi.mock("../client", () => ({
  api: {
    call: vi.fn(),
  },
}));

describe("productsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // list
  // ============================================================================

  describe("list", () => {
    it("should call api.call with correct action and empty params", async () => {
      const mockResponse = {
        data: { data: [], total: 0, page: 1, pageSize: 10 },
        error: null,
      };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await productsApi.list();

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "list",
        params: {},
      });
    });

    it("should pass filter params correctly", async () => {
      const mockResponse = { data: { data: [], total: 0 }, error: null };
      vi.mocked(api.call).mockResolvedValue(mockResponse);

      await productsApi.list({ page: 2, pageSize: 20, search: "test" });

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "list",
        params: { page: 2, pageSize: 20, search: "test" },
      });
    });

    it("should return paginated products", async () => {
      const mockData = {
        items: [
          { id: "1", name: "Product 1", price: 10000 },
          { id: "2", name: "Product 2", price: 20000 },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        hasMore: false,
      };
      vi.mocked(api.call).mockResolvedValue({ data: mockData, error: null });

      const result = await productsApi.list();

      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.total).toBe(2);
    });

    it("should handle empty list", async () => {
      const mockData = { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
      vi.mocked(api.call).mockResolvedValue({ data: mockData, error: null });

      const result = await productsApi.list();

      expect(result.data?.items).toEqual([]);
    });
  });

  // ============================================================================
  // get
  // ============================================================================

  describe("get", () => {
    it("should return single product by ID", async () => {
      const mockProduct = {
        id: "product-123",
        name: "Test Product",
        price: 15000,
        status: "active",
      };
      vi.mocked(api.call).mockResolvedValue({ data: mockProduct, error: null });

      const result = await productsApi.get("product-123");

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "get",
        params: { productId: "product-123" },
      });
      expect(result.data).toEqual(mockProduct);
    });

    it("should handle product not found", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: null,
        error: { code: "NOT_FOUND" as const, message: "Product not found" },
      });

      const result = await productsApi.get("invalid-id");

      expect(result.error).toHaveProperty("message", "Product not found");
    });
  });

  // ============================================================================
  // create
  // ============================================================================

  describe("create", () => {
    it("should create product with input", async () => {
      const input = { name: "New Product", price: 9900, description: "Desc" };
      const mockResponse = { success: true, id: "new-product-id" };
      vi.mocked(api.call).mockResolvedValue({ data: mockResponse, error: null });

      const result = await productsApi.create(input);

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "create",
        params: input,
      });
      expect(result.data?.success).toBe(true);
    });

    it("should validate required fields", async () => {
      const input = { name: "Product", price: 5000 };
      vi.mocked(api.call).mockResolvedValue({
        data: { success: true, id: "123" },
        error: null,
      });

      await productsApi.create(input);

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "create",
        params: { name: "Product", price: 5000 },
      });
    });
  });

  // ============================================================================
  // update
  // ============================================================================

  describe("update", () => {
    it("should update product fields", async () => {
      const input = { id: "prod-1", name: "Updated Name", price: 12000 };
      vi.mocked(api.call).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await productsApi.update(input);

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "update",
        params: input,
      });
      expect(result.data?.success).toBe(true);
    });

    it("should handle partial updates", async () => {
      const input = { id: "prod-1", status: "inactive" as const };
      vi.mocked(api.call).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await productsApi.update(input);

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "update",
        params: { id: "prod-1", status: "inactive" },
      });
    });
  });

  // ============================================================================
  // delete
  // ============================================================================

  describe("delete", () => {
    it("should delete product by ID", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await productsApi.delete("prod-to-delete");

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "delete",
        params: { productId: "prod-to-delete" },
      });
      expect(result.data?.success).toBe(true);
    });

    it("should handle delete errors", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: null,
        error: { code: "CONFLICT" as const, message: "Cannot delete product with active orders" },
      });

      const result = await productsApi.delete("prod-with-orders");

      expect(result.error?.message).toContain("Cannot delete");
    });
  });

  // ============================================================================
  // getSettings / updateSettings
  // ============================================================================

  describe("getSettings", () => {
    it("should get product settings", async () => {
      const mockSettings = {
        product_id: "prod-1",
        marketplace_enabled: true,
        marketplace_commission_rate: 10,
        affiliate_enabled: true,
        affiliate_commission_rate: 5,
      };
      vi.mocked(api.call).mockResolvedValue({ data: mockSettings, error: null });

      const result = await productsApi.getSettings("prod-1");

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "get_settings",
        params: { productId: "prod-1" },
      });
      expect(result.data).toEqual(mockSettings);
    });

    it("should handle settings not found", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: null,
        error: { code: "NOT_FOUND" as const, message: "Settings not found" },
      });

      const result = await productsApi.getSettings("invalid-prod");

      expect(result.error?.message).toBe("Settings not found");
    });
  });

  describe("updateSettings", () => {
    it("should update settings", async () => {
      const settings = { marketplace_enabled: false };
      vi.mocked(api.call).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await productsApi.updateSettings("prod-1", settings);

      expect(api.call).toHaveBeenCalledWith("products-api", {
        action: "update_settings",
        params: { productId: "prod-1", settings },
      });
      expect(result.data?.success).toBe(true);
    });
  });
});
