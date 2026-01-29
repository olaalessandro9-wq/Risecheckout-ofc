/**
 * Duplicate Product Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for deep product duplication via Edge Function:
 * - Validation
 * - Success case
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { duplicateProductDeep } from "../duplicateProduct";

// Mock api
const mockApiCall = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    call: (path: string, body: unknown) => mockApiCall(path, body),
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("duplicateProductDeep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========== VALIDATION ==========

  describe("Validation", () => {
    it("should throw for undefined product ID", async () => {
      await expect(
        duplicateProductDeep(undefined as unknown as string)
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for null product ID", async () => {
      await expect(
        duplicateProductDeep(null as unknown as string)
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for 'undefined' string", async () => {
      await expect(
        duplicateProductDeep("undefined")
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for 'null' string", async () => {
      await expect(
        duplicateProductDeep("null")
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for empty string", async () => {
      await expect(
        duplicateProductDeep("")
      ).rejects.toThrow("ID do produto inválido");
    });
  });

  // ========== SUCCESS ==========

  describe("Success", () => {
    it("should call Edge Function with correct parameters", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true, newProductId: "new-product-456" },
        error: null,
      });

      await duplicateProductDeep("product-123");

      expect(mockApiCall).toHaveBeenCalledWith("product-duplicate", {
        productId: "product-123",
      });
    });

    it("should return new product ID", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true, newProductId: "new-product-456" },
        error: null,
      });

      const result = await duplicateProductDeep("product-123");

      expect(result.newProductId).toBe("new-product-456");
    });

    it("should handle numeric product ID", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true, newProductId: "new-123" },
        error: null,
      });

      const result = await duplicateProductDeep(123 as unknown as string);

      expect(mockApiCall).toHaveBeenCalledWith("product-duplicate", {
        productId: "123",
      });
      expect(result.newProductId).toBe("new-123");
    });

    it("should trim product ID", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true, newProductId: "new-456" },
        error: null,
      });

      await duplicateProductDeep("  product-123  ");

      expect(mockApiCall).toHaveBeenCalledWith("product-duplicate", {
        productId: "product-123",
      });
    });
  });

  // ========== ERROR HANDLING ==========

  describe("Error Handling", () => {
    it("should throw on API error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "Duplication failed" },
      });

      await expect(
        duplicateProductDeep("product-123")
      ).rejects.toThrow("Duplication failed");
    });

    it("should throw when success is false", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: false, error: "Product not found" },
        error: null,
      });

      await expect(
        duplicateProductDeep("product-123")
      ).rejects.toThrow("Product not found");
    });

    it("should throw when newProductId is missing", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true }, // Missing newProductId
        error: null,
      });

      await expect(
        duplicateProductDeep("product-123")
      ).rejects.toThrow("Resposta inválida: newProductId não encontrado");
    });

    it("should use default error message when none provided", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: false }, // No error message
        error: null,
      });

      await expect(
        duplicateProductDeep("product-123")
      ).rejects.toThrow("Falha ao duplicar produto");
    });
  });
});
