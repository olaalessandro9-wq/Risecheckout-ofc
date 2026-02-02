/**
 * useAddProduct Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for useAddProduct hook covering:
 * - Form state management
 * - Step navigation
 * - Validation logic
 * - API integration
 * - Error handling
 * 
 * @module components/products/add-product-dialog/__tests__/useAddProduct.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as apiModule from "@/lib/api";
import { mockProductCreateSuccess, mockProductCreateError } from "@/test/mocks/api-mocks";

// Mock dependencies BEFORE importing the hook
vi.mock("@/lib/api");
vi.mock("react-router-dom", async () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { useAddProduct } from "../useAddProduct";

const getDefaultProps = () => ({
  onOpenChange: vi.fn(),
  onProductAdded: vi.fn(),
});

describe("useAddProduct", () => {
  const mockApiCall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiCall.mockResolvedValue(mockProductCreateSuccess);
    Object.defineProperty(apiModule.api, 'call', {
      value: mockApiCall,
      writable: true,
      configurable: true,
    });
  });

  describe("Initial State", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      expect(result.current.loading).toBe(false);
      expect(result.current.step).toBe(1);
      expect(result.current.deliveryType).toBe("standard");
      expect(result.current.deliveryUrlError).toBe("");
      expect(result.current.formData).toEqual({
        name: "",
        description: "",
        price: 0,
        delivery_url: "",
      });
    });
  });

  describe("Form Data Updates", () => {
    it("updates form data correctly", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({ name: "Novo Produto" });
      });

      expect(result.current.formData.name).toBe("Novo Produto");
    });

    it("preserves other fields when updating", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({ name: "Produto" });
        result.current.updateFormData({ price: 9900 });
      });

      expect(result.current.formData.name).toBe("Produto");
      expect(result.current.formData.price).toBe(9900);
    });
  });

  describe("Step Navigation", () => {
    it("advances to step 2 when form is valid", async () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          name: "Produto",
          description: "Descrição",
          price: 9900,
        });
      });

      await act(async () => {
        result.current.handleContinue();
      });

      expect(result.current.step).toBe(2);
    });

    it("does not advance when name is empty", async () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          description: "Descrição",
          price: 9900,
        });
      });

      await act(async () => {
        result.current.handleContinue();
      });

      expect(result.current.step).toBe(1);
    });

    it("goes back to step 1 when handleBack is called", async () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          name: "Produto",
          description: "Descrição",
          price: 9900,
        });
      });

      await act(async () => {
        result.current.handleContinue();
      });

      act(() => {
        result.current.handleBack();
      });

      expect(result.current.step).toBe(1);
    });
  });

  describe("Delivery Type Management", () => {
    it("changes delivery type", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.handleDeliveryTypeChange("members_area");
      });

      expect(result.current.deliveryType).toBe("members_area");
    });

    it("clears delivery URL when changing to non-standard type", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({ delivery_url: "https://exemplo.com" });
        result.current.handleDeliveryTypeChange("members_area");
      });

      expect(result.current.formData.delivery_url).toBe("");
      expect(result.current.deliveryUrlError).toBe("");
    });
  });

  describe("URL Validation", () => {
    it("validates URL correctly for standard delivery", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateDeliveryUrl("https://exemplo.com");
      });

      expect(isValid).toBe(true);
      expect(result.current.deliveryUrlError).toBe("");
    });

    it("sets error for invalid URL", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validateDeliveryUrl("invalid-url");
      });

      expect(isValid).toBe(false);
      expect(result.current.deliveryUrlError).toBeTruthy();
    });

    it("skips validation for non-standard delivery", () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.handleDeliveryTypeChange("members_area");
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validateDeliveryUrl("");
      });

      expect(isValid).toBe(true);
      expect(result.current.deliveryUrlError).toBe("");
    });
  });

  describe("Form Submission", () => {
    it("submits form successfully", async () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          name: "Produto Teste",
          description: "Descrição",
          price: 9900,
          delivery_url: "https://exemplo.com",
        });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith("product-crud", expect.objectContaining({
          action: "create",
          product: expect.objectContaining({
            name: "Produto Teste",
            price: 9900,
          }),
        }));
      });
    });

    it("manages loading state during submission", async () => {
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          name: "Produto",
          description: "Descrição",
          price: 9900,
        });
        result.current.handleDeliveryTypeChange("members_area");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.loading).toBe(false);
    });

    it("handles API errors gracefully", async () => {
      mockApiCall.mockResolvedValueOnce(mockProductCreateError);
      const { result } = renderHook(() => useAddProduct(getDefaultProps()));

      act(() => {
        result.current.updateFormData({
          name: "Produto",
          description: "Descrição",
          price: 9900,
        });
        result.current.handleDeliveryTypeChange("members_area");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("Form Reset", () => {
    it("resets form when cancelled", () => {
      const props = getDefaultProps();
      const { result } = renderHook(() => useAddProduct(props));

      act(() => {
        result.current.updateFormData({ name: "Produto" });
        result.current.handleCancel();
      });

      expect(result.current.formData.name).toBe("");
      expect(result.current.step).toBe(1);
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
