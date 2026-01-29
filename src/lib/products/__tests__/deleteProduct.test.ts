/**
 * Delete Product Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for smart delete via Edge Function:
 * - Validation
 * - Success case
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteProductCascade } from "../deleteProduct";

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

// Mock Supabase client
const mockSupabaseClient = {} as Parameters<typeof deleteProductCascade>[0];

describe("deleteProductCascade", () => {
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
        deleteProductCascade(mockSupabaseClient, undefined as unknown as string)
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for null product ID", async () => {
      await expect(
        deleteProductCascade(mockSupabaseClient, null as unknown as string)
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for 'undefined' string", async () => {
      await expect(
        deleteProductCascade(mockSupabaseClient, "undefined")
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for 'null' string", async () => {
      await expect(
        deleteProductCascade(mockSupabaseClient, "null")
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for empty string", async () => {
      await expect(
        deleteProductCascade(mockSupabaseClient, "")
      ).rejects.toThrow("ID do produto inválido");
    });

    it("should throw for whitespace-only string", async () => {
      await expect(
        deleteProductCascade(mockSupabaseClient, "   ")
      ).rejects.toThrow("ID do produto inválido");
    });
  });

  // ========== SUCCESS ==========

  describe("Success", () => {
    it("should call Edge Function with correct parameters", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await deleteProductCascade(mockSupabaseClient, "product-123");

      expect(mockApiCall).toHaveBeenCalledWith("product-settings", {
        action: "smart-delete",
        productId: "product-123",
      });
    });

    it("should handle numeric product ID", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await deleteProductCascade(mockSupabaseClient, 123 as unknown as string);

      expect(mockApiCall).toHaveBeenCalledWith("product-settings", {
        action: "smart-delete",
        productId: "123",
      });
    });

    it("should trim product ID", async () => {
      mockApiCall.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await deleteProductCascade(mockSupabaseClient, "  product-123  ");

      expect(mockApiCall).toHaveBeenCalledWith("product-settings", {
        action: "smart-delete",
        productId: "product-123",
      });
    });
  });

  // ========== ERROR HANDLING ==========

  describe("Error Handling", () => {
    it("should throw on API error", async () => {
      mockApiCall.mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      });

      await expect(
        deleteProductCascade(mockSupabaseClient, "product-123")
      ).rejects.toThrow("Erro ao excluir produto: Network error");
    });

    it("should throw on business logic error", async () => {
      mockApiCall.mockResolvedValue({
        data: { error: "Product has active orders" },
        error: null,
      });

      await expect(
        deleteProductCascade(mockSupabaseClient, "product-123")
      ).rejects.toThrow("Product has active orders");
    });
  });
});
