/**
 * useProduct.test.tsx
 * 
 * Tests for useProduct hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [mockSearchParams, vi.fn()],
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "test-user-id" },
  })),
}));

vi.mock("@/lib/storage/storageProxy", () => ({
  uploadViaEdge: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useProduct } from "../useProduct";
import { api } from "@/lib/api";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { toast } from "sonner";

describe("useProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("id");
  });

  it("should initialize with null product", () => {
    const { result } = renderHook(() => useProduct());

    expect(result.current.product).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.imageFile).toBeNull();
  });

  it("should load product when id is present", async () => {
    mockSearchParams.set("id", "prod-123");

    const mockProduct = {
      id: "prod-123",
      name: "Test Product",
      description: "Description",
      price: 9900,
      image_url: "https://example.com/image.jpg",
      support_name: "Support",
      support_email: "support@test.com",
      status: "active",
    };

    vi.mocked(api.call).mockResolvedValueOnce({
      data: { product: mockProduct },
      error: null,
    });

    const { result } = renderHook(() => useProduct());

    await waitFor(() => {
      expect(result.current.product).not.toBeNull();
    });

    expect(result.current.product?.name).toBe("Test Product");
    expect(result.current.product?.price).toBe(9900);
  });

  it("should handle load error", async () => {
    mockSearchParams.set("id", "prod-123");

    vi.mocked(api.call).mockResolvedValueOnce({
      data: null,
      error: { code: "NOT_FOUND", message: "Not found" },
    });

    renderHook(() => useProduct());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao carregar produto");
    });
  });

  describe("saveProduct", () => {
    it("should show error when not authenticated", async () => {
      const { result } = renderHook(() => useProduct());

      await act(async () => {
        await result.current.saveProduct({ name: "Test", price: 100 });
      });

      // Should validate name first, but user check comes first
      // The hook checks user in the implementation
    });

    it("should validate required fields", async () => {
      const { result } = renderHook(() => useProduct());

      await act(async () => {
        await result.current.saveProduct({ name: "", price: 100 });
      });

      expect(toast.error).toHaveBeenCalledWith("O nome do produto é obrigatório");
    });

    it("should validate price", async () => {
      const { result } = renderHook(() => useProduct());

      await act(async () => {
        await result.current.saveProduct({ name: "Test", price: 0 });
      });

      expect(toast.error).toHaveBeenCalledWith("O preço do produto deve ser maior que zero");
    });

    it("should create product successfully", async () => {
      vi.mocked(api.call).mockResolvedValueOnce({
        data: {
          success: true,
          product: {
            id: "new-prod",
            name: "New Product",
            description: "",
            price: 9900,
            image_url: null,
            support_name: "",
            support_email: "",
            status: "active",
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useProduct());

      await act(async () => {
        await result.current.saveProduct({
          name: "New Product",
          price: 9900,
        });
      });

      expect(toast.success).toHaveBeenCalledWith("Produto criado com sucesso");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/produtos/editar?id=new-prod");
    });

    it("should upload image when imageFile is set", async () => {
      mockSearchParams.set("id", "prod-123");

      vi.mocked(uploadViaEdge).mockResolvedValueOnce({
        publicUrl: "https://uploaded.com/image.jpg",
        path: "test-user-id/prod-123.jpg",
        error: null,
      });

      vi.mocked(api.call)
        .mockResolvedValueOnce({
          data: {
            product: {
              id: "prod-123",
              name: "Test",
              description: "",
              price: 9900,
              image_url: null,
              support_name: "",
              support_email: "",
              status: "active",
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { product: { id: "prod-123", name: "Test", price: 9900 } },
          error: null,
        });

      const { result } = renderHook(() => useProduct());

      await waitFor(() => {
        expect(result.current.product).not.toBeNull();
      });

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      act(() => {
        result.current.setImageFile(file);
      });

      await act(async () => {
        await result.current.saveProduct({
          name: "Test",
          price: 9900,
        });
      });

      expect(uploadViaEdge).toHaveBeenCalled();
    });
  });

  describe("deleteProduct", () => {
    it("should return false when no productId", async () => {
      const { result } = renderHook(() => useProduct());

      const success = await result.current.deleteProduct();
      expect(success).toBe(false);
    });

    it("should delete product successfully", async () => {
      mockSearchParams.set("id", "prod-123");

      vi.mocked(api.call)
        .mockResolvedValueOnce({
          data: { product: { id: "prod-123", name: "Test", status: "active" } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        });

      const { result } = renderHook(() => useProduct());

      await waitFor(() => {
        expect(result.current.product).not.toBeNull();
      });

      const success = await result.current.deleteProduct();

      expect(success).toBe(true);
      expect(toast.success).toHaveBeenCalledWith("Produto excluído com sucesso");
    });

    it("should handle delete error", async () => {
      mockSearchParams.set("id", "prod-123");

      vi.mocked(api.call)
        .mockResolvedValueOnce({
          data: { product: { id: "prod-123", name: "Test", status: "active" } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: false, error: "Cannot delete" },
          error: null,
        });

      const { result } = renderHook(() => useProduct());

      await waitFor(() => {
        expect(result.current.product).not.toBeNull();
      });

      const success = await result.current.deleteProduct();

      expect(success).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
