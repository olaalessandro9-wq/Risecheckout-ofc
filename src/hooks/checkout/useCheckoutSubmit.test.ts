/**
 * Unit Tests: useCheckoutSubmit
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the checkout submit logic hook.
 * 
 * @module hooks/checkout/useCheckoutSubmit.test
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutSubmit } from "./useCheckoutSubmit";

// ============================================================================
// Initial State
// ============================================================================

describe("useCheckoutSubmit - Initial State", () => {
  it("should initialize with null cardSubmitFn", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    expect(result.current.cardSubmitFn).toBeNull();
  });

  it("should initialize formRef with null", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    expect(result.current.formRef.current).toBeNull();
  });

  it("should provide handleCardSubmitReady function", () => {
    const { result } = renderHook(() => useCheckoutSubmit("credit_card"));
    
    expect(typeof result.current.handleCardSubmitReady).toBe("function");
  });

  it("should provide handleCheckoutClick function", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    expect(typeof result.current.handleCheckoutClick).toBe("function");
  });
});

// ============================================================================
// handleCardSubmitReady
// ============================================================================

describe("useCheckoutSubmit - handleCardSubmitReady", () => {
  it("should register card submit function", () => {
    const { result } = renderHook(() => useCheckoutSubmit("credit_card"));
    
    const mockSubmitFn = vi.fn();
    
    act(() => {
      result.current.handleCardSubmitReady(mockSubmitFn);
    });
    
    expect(result.current.cardSubmitFn).toBe(mockSubmitFn);
  });

  it("should update card submit function when called again", () => {
    const { result } = renderHook(() => useCheckoutSubmit("credit_card"));
    
    const firstFn = vi.fn();
    const secondFn = vi.fn();
    
    act(() => {
      result.current.handleCardSubmitReady(firstFn);
    });
    
    act(() => {
      result.current.handleCardSubmitReady(secondFn);
    });
    
    expect(result.current.cardSubmitFn).toBe(secondFn);
  });
});

// ============================================================================
// handleCheckoutClick - Credit Card
// ============================================================================

describe("useCheckoutSubmit - handleCheckoutClick (Credit Card)", () => {
  it("should call cardSubmitFn when payment is credit_card", () => {
    const { result } = renderHook(() => useCheckoutSubmit("credit_card"));
    
    const mockSubmitFn = vi.fn();
    
    act(() => {
      result.current.handleCardSubmitReady(mockSubmitFn);
    });
    
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(mockSubmitFn).toHaveBeenCalledTimes(1);
  });

  it("should not throw when cardSubmitFn is null for credit_card", () => {
    const { result } = renderHook(() => useCheckoutSubmit("credit_card"));
    
    // No cardSubmitFn registered
    expect(() => {
      act(() => {
        result.current.handleCheckoutClick();
      });
    }).not.toThrow();
  });
});

// ============================================================================
// handleCheckoutClick - PIX
// ============================================================================

describe("useCheckoutSubmit - handleCheckoutClick (PIX)", () => {
  it("should call formRef.requestSubmit when payment is pix", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    const mockRequestSubmit = vi.fn();
    const mockForm = { requestSubmit: mockRequestSubmit } as unknown as HTMLFormElement;
    
    // Set formRef using Object.defineProperty
    Object.defineProperty(result.current.formRef, 'current', {
      value: mockForm,
      writable: true,
    });
    
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(mockRequestSubmit).toHaveBeenCalledTimes(1);
  });

  it("should fallback to document.querySelector when formRef is null", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    const mockRequestSubmit = vi.fn();
    const mockForm = { requestSubmit: mockRequestSubmit };
    
    // Mock document.querySelector
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockForm);
    
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(document.querySelector).toHaveBeenCalledWith("form");
    expect(mockRequestSubmit).toHaveBeenCalledTimes(1);
    
    // Restore
    document.querySelector = originalQuerySelector;
  });

  it("should not throw when no form is found", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(null);
    
    expect(() => {
      act(() => {
        result.current.handleCheckoutClick();
      });
    }).not.toThrow();
    
    document.querySelector = originalQuerySelector;
  });

  it("should not call cardSubmitFn when payment is pix", () => {
    const { result } = renderHook(() => useCheckoutSubmit("pix"));
    
    const mockSubmitFn = vi.fn();
    
    act(() => {
      result.current.handleCardSubmitReady(mockSubmitFn);
    });
    
    // Mock formRef using Object.defineProperty
    const mockRequestSubmit = vi.fn();
    Object.defineProperty(result.current.formRef, 'current', {
      value: { requestSubmit: mockRequestSubmit } as unknown as HTMLFormElement,
      writable: true,
    });
    
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(mockSubmitFn).not.toHaveBeenCalled();
    expect(mockRequestSubmit).toHaveBeenCalled();
  });
});

// ============================================================================
// Payment Method Changes
// ============================================================================

describe("useCheckoutSubmit - Payment Method Changes", () => {
  it("should use correct submit method after payment change", () => {
    // Start with PIX
    const { result, rerender } = renderHook(
      ({ payment }: { payment: 'pix' | 'credit_card' }) => useCheckoutSubmit(payment),
      { initialProps: { payment: "pix" as 'pix' | 'credit_card' } }
    );
    
    const mockCardSubmit = vi.fn();
    const mockFormSubmit = vi.fn();
    
    // Register card submit
    act(() => {
      result.current.handleCardSubmitReady(mockCardSubmit);
    });
    
    // Set form ref using Object.defineProperty
    Object.defineProperty(result.current.formRef, 'current', {
      value: { requestSubmit: mockFormSubmit } as unknown as HTMLFormElement,
      writable: true,
    });
    
    // Click while PIX
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(mockFormSubmit).toHaveBeenCalledTimes(1);
    expect(mockCardSubmit).not.toHaveBeenCalled();
    
    // Change to credit_card
    rerender({ payment: "credit_card" as 'pix' | 'credit_card' });
    
    act(() => {
      result.current.handleCheckoutClick();
    });
    
    expect(mockCardSubmit).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Callback Stability
// ============================================================================

describe("useCheckoutSubmit - Callback Stability", () => {
  it("should maintain stable handleCardSubmitReady reference", () => {
    const { result, rerender } = renderHook(() => useCheckoutSubmit("pix"));
    
    const firstRef = result.current.handleCardSubmitReady;
    
    rerender();
    
    const secondRef = result.current.handleCardSubmitReady;
    
    expect(firstRef).toBe(secondRef);
  });

  it("should update handleCheckoutClick when selectedPayment changes", () => {
    const { result, rerender } = renderHook(
      ({ payment }: { payment: 'pix' | 'credit_card' }) => useCheckoutSubmit(payment),
      { initialProps: { payment: "pix" as 'pix' | 'credit_card' } }
    );
    
    const pixHandler = result.current.handleCheckoutClick;
    
    rerender({ payment: "credit_card" as 'pix' | 'credit_card' });
    
    const cardHandler = result.current.handleCheckoutClick;
    
    // Handler should be different due to selectedPayment dependency
    expect(pixHandler).not.toBe(cardHandler);
  });
});
