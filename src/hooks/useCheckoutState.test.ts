/**
 * Unit Tests: useCheckoutState
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the checkout state management hook.
 * 
 * @module hooks/useCheckoutState.test
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutState } from "./useCheckoutState";
import type { OrderBump, ProductData } from "./useCheckoutState";

// ============================================================================
// Test Fixtures
// ============================================================================

const mockProduct: ProductData = {
  id: "prod-1",
  name: "Digital Course",
  price: 9900, // R$ 99,00
  image_url: "https://example.com/image.jpg",
  description: "A great course",
};

const mockOrderBumps: OrderBump[] = [
  {
    id: "bump-1",
    name: "E-Book Bonus",
    price: 1900, // R$ 19,00
    description: "Complementary e-book",
  },
  {
    id: "bump-2",
    name: "Video Bonus",
    price: 2900, // R$ 29,00
    description: "Exclusive video content",
  },
  {
    id: "bump-3",
    name: "Template Pack",
    price: 990, // R$ 9,90
    description: "Template collection",
  },
];

// ============================================================================
// Initial State
// ============================================================================

describe("useCheckoutState - Initial State", () => {
  it("should initialize with default payment method 'pix'", () => {
    const { result } = renderHook(() => useCheckoutState(mockProduct));
    
    expect(result.current.selectedPayment).toBe("pix");
  });

  it("should accept custom initial payment method", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, [], "credit_card")
    );
    
    expect(result.current.selectedPayment).toBe("credit_card");
  });

  it("should initialize with empty selected bumps", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    expect(result.current.selectedBumps.size).toBe(0);
  });

  it("should calculate correct product price", () => {
    const { result } = renderHook(() => useCheckoutState(mockProduct));
    
    expect(result.current.productPrice).toBe(9900);
  });

  it("should have zero bumps total initially", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    expect(result.current.bumpsTotal).toBe(0);
  });

  it("should have total equal to product price initially", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    expect(result.current.totalPrice).toBe(9900);
  });

  it("should handle undefined product data", () => {
    const { result } = renderHook(() => useCheckoutState(undefined));
    
    expect(result.current.productPrice).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("should handle empty order bumps array", () => {
    const { result } = renderHook(() => useCheckoutState(mockProduct, []));
    
    expect(result.current.selectedBumps.size).toBe(0);
    expect(result.current.bumpsTotal).toBe(0);
  });
});

// ============================================================================
// Payment Method Selection
// ============================================================================

describe("useCheckoutState - Payment Method", () => {
  it("should change payment method to credit_card", () => {
    const { result } = renderHook(() => useCheckoutState(mockProduct));
    
    act(() => {
      result.current.setSelectedPayment("credit_card");
    });
    
    expect(result.current.selectedPayment).toBe("credit_card");
  });

  it("should change payment method back to pix", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, [], "credit_card")
    );
    
    act(() => {
      result.current.setSelectedPayment("pix");
    });
    
    expect(result.current.selectedPayment).toBe("pix");
  });

  it("should not affect other state when changing payment", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    // Add a bump first
    act(() => {
      result.current.toggleBump("bump-1");
    });
    
    const bumpsBeforeChange = result.current.selectedBumps.size;
    
    // Change payment
    act(() => {
      result.current.setSelectedPayment("credit_card");
    });
    
    expect(result.current.selectedBumps.size).toBe(bumpsBeforeChange);
  });
});

// ============================================================================
// Order Bump Selection
// ============================================================================

describe("useCheckoutState - Toggle Bump", () => {
  it("should add bump when toggled", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
    });
    
    expect(result.current.selectedBumps.has("bump-1")).toBe(true);
    expect(result.current.selectedBumps.size).toBe(1);
  });

  it("should remove bump when toggled again", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
    });
    
    act(() => {
      result.current.toggleBump("bump-1");
    });
    
    expect(result.current.selectedBumps.has("bump-1")).toBe(false);
    expect(result.current.selectedBumps.size).toBe(0);
  });

  it("should handle multiple bumps", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
      result.current.toggleBump("bump-2");
    });
    
    expect(result.current.selectedBumps.has("bump-1")).toBe(true);
    expect(result.current.selectedBumps.has("bump-2")).toBe(true);
    expect(result.current.selectedBumps.size).toBe(2);
  });

  it("should remove specific bump without affecting others", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
      result.current.toggleBump("bump-2");
      result.current.toggleBump("bump-3");
    });
    
    act(() => {
      result.current.toggleBump("bump-2"); // Remove bump-2
    });
    
    expect(result.current.selectedBumps.has("bump-1")).toBe(true);
    expect(result.current.selectedBumps.has("bump-2")).toBe(false);
    expect(result.current.selectedBumps.has("bump-3")).toBe(true);
  });

  it("should handle non-existent bump id gracefully", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("non-existent-bump");
    });
    
    // Should add to set even if bump doesn't exist in bumps array
    // (price calculation will handle it)
    expect(result.current.selectedBumps.has("non-existent-bump")).toBe(true);
  });
});

// ============================================================================
// Price Calculations
// ============================================================================

describe("useCheckoutState - Price Calculations", () => {
  it("should calculate bumps total correctly", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1"); // R$ 19,00
    });
    
    expect(result.current.bumpsTotal).toBe(1900);
  });

  it("should calculate total price with one bump", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1"); // R$ 19,00
    });
    
    // Product (R$ 99,00) + Bump (R$ 19,00) = R$ 118,00
    expect(result.current.totalPrice).toBe(11800);
  });

  it("should calculate total price with multiple bumps", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1"); // R$ 19,00
      result.current.toggleBump("bump-2"); // R$ 29,00
    });
    
    // Product (R$ 99,00) + Bumps (R$ 48,00) = R$ 147,00
    expect(result.current.totalPrice).toBe(14700);
  });

  it("should calculate total price with all bumps", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1"); // R$ 19,00
      result.current.toggleBump("bump-2"); // R$ 29,00
      result.current.toggleBump("bump-3"); // R$ 9,90
    });
    
    // Product (R$ 99,00) + Bumps (R$ 57,90) = R$ 156,90
    expect(result.current.totalPrice).toBe(15690);
  });

  it("should update total when bump is removed", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
      result.current.toggleBump("bump-2");
    });
    
    act(() => {
      result.current.toggleBump("bump-1"); // Remove
    });
    
    // Product (R$ 99,00) + Bump-2 (R$ 29,00) = R$ 128,00
    expect(result.current.totalPrice).toBe(12800);
  });

  it("should handle non-existent bump in calculation (zero price)", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("non-existent");
    });
    
    // Non-existent bump should add 0 to total
    expect(result.current.bumpsTotal).toBe(0);
    expect(result.current.totalPrice).toBe(9900);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("useCheckoutState - Edge Cases", () => {
  it("should handle product with zero price", () => {
    const freeProduct: ProductData = { ...mockProduct, price: 0 };
    const { result } = renderHook(() => 
      useCheckoutState(freeProduct, mockOrderBumps)
    );
    
    expect(result.current.productPrice).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it("should handle product price as string (coercion)", () => {
    const productWithStringPrice: ProductData = { 
      ...mockProduct, 
      price: "9900" as unknown as number 
    };
    const { result } = renderHook(() => 
      useCheckoutState(productWithStringPrice)
    );
    
    expect(result.current.productPrice).toBe(9900);
  });

  it("should return new Set on each render (referential stability)", () => {
    const { result, rerender } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    const firstSet = result.current.selectedBumps;
    
    rerender();
    
    const secondSet = result.current.selectedBumps;
    
    // Sets should be same reference if no changes
    expect(firstSet).toBe(secondSet);
  });

  it("should handle rapid toggle operations", () => {
    const { result } = renderHook(() => 
      useCheckoutState(mockProduct, mockOrderBumps)
    );
    
    act(() => {
      result.current.toggleBump("bump-1");
      result.current.toggleBump("bump-1");
      result.current.toggleBump("bump-1");
    });
    
    // Odd number of toggles = selected
    expect(result.current.selectedBumps.has("bump-1")).toBe(true);
  });
});
