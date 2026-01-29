/**
 * Unit Tests: useCouponValidation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the coupon validation hook.
 * Uses MSW to mock API responses.
 * 
 * @module hooks/checkout/useCouponValidation.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useCouponValidation } from "./useCouponValidation";

// ============================================================================
// Test Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";
const PRODUCT_ID = "prod-123";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mock
import { toast } from "sonner";

// ============================================================================
// Test Helpers
// ============================================================================

function createSuccessHandler(couponData: Record<string, unknown>) {
  return http.post(`${API_URL}/checkout-public-data`, () => {
    return HttpResponse.json({
      success: true,
      data: couponData,
    });
  });
}

function createErrorHandler(errorMessage: string) {
  return http.post(`${API_URL}/checkout-public-data`, () => {
    return HttpResponse.json({
      success: false,
      error: errorMessage,
    });
  });
}

// ============================================================================
// Initial State
// ============================================================================

describe("useCouponValidation - Initial State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty coupon code", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(result.current.couponCode).toBe("");
  });

  it("should initialize with null applied coupon", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(result.current.appliedCoupon).toBeNull();
  });

  it("should initialize with isValidating false", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(result.current.isValidating).toBe(false);
  });

  it("should provide setCouponCode function", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(typeof result.current.setCouponCode).toBe("function");
  });

  it("should provide validateCoupon function", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(typeof result.current.validateCoupon).toBe("function");
  });

  it("should provide removeCoupon function", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    expect(typeof result.current.removeCoupon).toBe("function");
  });
});

// ============================================================================
// setCouponCode
// ============================================================================

describe("useCouponValidation - setCouponCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update coupon code", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    expect(result.current.couponCode).toBe("SAVE10");
  });

  it("should handle multiple updates", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("SAVE");
    });
    
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    expect(result.current.couponCode).toBe("SAVE10");
  });
});

// ============================================================================
// validateCoupon - Validation Errors
// ============================================================================

describe("useCouponValidation - Validation Errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show error toast for empty coupon code", async () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    expect(toast.error).toHaveBeenCalledWith("Digite um código de cupom");
  });

  it("should show error toast for whitespace-only coupon", async () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("   ");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    expect(toast.error).toHaveBeenCalledWith("Digite um código de cupom");
  });

  it("should show error toast when productId is missing", async () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: undefined })
    );
    
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    expect(toast.error).toHaveBeenCalledWith("Produto não identificado");
  });
});

// ============================================================================
// validateCoupon - API Success
// ============================================================================

describe("useCouponValidation - API Success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should apply valid coupon", async () => {
    const couponData = {
      id: "coupon-1",
      code: "SAVE10",
      name: "10% Off",
      discount_type: "percentage",
      discount_value: 10,
      apply_to_order_bumps: false,
    };
    
    server.use(createSuccessHandler(couponData));
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    await waitFor(() => {
      expect(result.current.appliedCoupon).not.toBeNull();
    });
    
    expect(result.current.appliedCoupon?.code).toBe("SAVE10");
    expect(result.current.appliedCoupon?.discount_value).toBe(10);
  });

  it("should show success toast when coupon is applied", async () => {
    const couponData = {
      id: "coupon-1",
      code: "DISCOUNT20",
      name: "20% Off",
      discount_type: "percentage",
      discount_value: 20,
      apply_to_order_bumps: true,
    };
    
    server.use(createSuccessHandler(couponData));
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("DISCOUNT20");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it("should set isValidating during API call", async () => {
    let resolveHandler: () => void;
    const handlerPromise = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });
    
    server.use(
      http.post(`${API_URL}/checkout-public-data`, async () => {
        await handlerPromise;
        return HttpResponse.json({
          success: true,
          data: {
            id: "coupon-1",
            code: "TEST",
            name: "Test",
            discount_type: "percentage",
            discount_value: 5,
            apply_to_order_bumps: false,
          },
        });
      })
    );
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("TEST");
    });
    
    let validatePromise: Promise<void>;
    act(() => {
      validatePromise = result.current.validateCoupon();
    });
    
    // Should be validating
    expect(result.current.isValidating).toBe(true);
    
    // Resolve the handler
    resolveHandler!();
    
    await act(async () => {
      await validatePromise;
    });
    
    // Should no longer be validating
    expect(result.current.isValidating).toBe(false);
  });
});

// ============================================================================
// validateCoupon - API Error
// ============================================================================

describe("useCouponValidation - API Error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show error toast for invalid coupon", async () => {
    server.use(createErrorHandler("Cupom inválido ou expirado"));
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("INVALID");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Cupom inválido ou expirado");
    });
  });

  it("should not apply coupon on error", async () => {
    server.use(createErrorHandler("Cupom expirado"));
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("EXPIRED");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    expect(result.current.appliedCoupon).toBeNull();
  });
});

// ============================================================================
// removeCoupon
// ============================================================================

describe("useCouponValidation - removeCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear applied coupon", async () => {
    const couponData = {
      id: "coupon-1",
      code: "SAVE10",
      name: "10% Off",
      discount_type: "percentage",
      discount_value: 10,
      apply_to_order_bumps: false,
    };
    
    server.use(createSuccessHandler(couponData));
    
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    // Apply coupon first
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    await act(async () => {
      await result.current.validateCoupon();
    });
    
    await waitFor(() => {
      expect(result.current.appliedCoupon).not.toBeNull();
    });
    
    // Remove coupon
    act(() => {
      result.current.removeCoupon();
    });
    
    expect(result.current.appliedCoupon).toBeNull();
  });

  it("should clear coupon code", async () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.setCouponCode("SAVE10");
    });
    
    act(() => {
      result.current.removeCoupon();
    });
    
    expect(result.current.couponCode).toBe("");
  });

  it("should show success toast when removing", () => {
    const { result } = renderHook(() => 
      useCouponValidation({ productId: PRODUCT_ID })
    );
    
    act(() => {
      result.current.removeCoupon();
    });
    
    expect(toast.success).toHaveBeenCalledWith("Cupom removido");
  });
});
