/**
 * fetchOrderBumpCandidates Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the fetchOrderBumpCandidates function.
 * 
 * @module test/lib/orderBump/fetchCandidates
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOrderBumpCandidates } from "@/lib/orderBump/fetchCandidates";
import { api } from "@/lib/api";

// Mock the api module
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

describe("fetchOrderBumpCandidates", () => {
  const mockApiCall = vi.mocked(api.call);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should return list of active products", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Product 1", price: 9990, status: "active" },
        { id: "prod-2", name: "Product 2", price: 4990, status: "active" },
      ];

      mockApiCall.mockResolvedValue({
        data: { products: mockProducts },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "prod-1",
        name: "Product 1",
        price: 9990,
        image_url: undefined,
        description: undefined,
      });
    });

    it("should filter out inactive products", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Active", price: 9990, status: "active" },
        { id: "prod-2", name: "Draft", price: 4990, status: "draft" },
        { id: "prod-3", name: "Archived", price: 2990, status: "archived" },
      ];

      mockApiCall.mockResolvedValue({
        data: { products: mockProducts },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Active");
    });

    it("should exclude specified product", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Product 1", price: 9990, status: "active" },
        { id: "prod-2", name: "Product 2", price: 4990, status: "active" },
        { id: "prod-3", name: "Product 3", price: 2990, status: "active" },
      ];

      mockApiCall.mockResolvedValue({
        data: { products: mockProducts },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123", {
        excludeProductId: "prod-2",
      });

      expect(result).toHaveLength(2);
      expect(result.find(p => p.id === "prod-2")).toBeUndefined();
    });

    it("should return empty array when no products", async () => {
      mockApiCall.mockResolvedValue({
        data: { products: [] },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result).toEqual([]);
    });

    it("should convert price to number", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Product 1", price: "9990", status: "active" },
      ];

      mockApiCall.mockResolvedValue({
        data: { products: mockProducts },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(typeof result[0].price).toBe("number");
      expect(result[0].price).toBe(9990);
    });

    it("should include optional fields when present", async () => {
      const mockProducts = [
        {
          id: "prod-1",
          name: "Product 1",
          price: 9990,
          status: "active",
          image_url: "https://example.com/image.jpg",
          description: "A great product",
        },
      ];

      mockApiCall.mockResolvedValue({
        data: { products: mockProducts },
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result[0].image_url).toBe("https://example.com/image.jpg");
      expect(result[0].description).toBe("A great product");
    });
  });

  describe("error cases", () => {
    it("should throw when userId is empty", async () => {
      await expect(fetchOrderBumpCandidates("")).rejects.toThrow(
        "Usuário não autenticado"
      );
    });

    it("should throw on edge function error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { code: "NETWORK_ERROR", message: "Network error" },
      });

      await expect(fetchOrderBumpCandidates("user-123")).rejects.toThrow();
    });

    it("should throw on API error in response", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "Unauthorized" },
        error: null,
      });

      await expect(fetchOrderBumpCandidates("user-123")).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("API call parameters", () => {
    it("should call products-crud with correct action", async () => {
      mockApiCall.mockResolvedValue({
        data: { products: [] },
        error: null,
      });

      await fetchOrderBumpCandidates("user-123");

      expect(mockApiCall).toHaveBeenCalledWith("products-crud", {
        action: "list",
        excludeDeleted: true,
      });
    });
  });

  describe("data handling", () => {
    it("should handle undefined products array", async () => {
      mockApiCall.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result).toEqual([]);
    });

    it("should handle null response data", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await fetchOrderBumpCandidates("user-123");

      expect(result).toEqual([]);
    });
  });
});
