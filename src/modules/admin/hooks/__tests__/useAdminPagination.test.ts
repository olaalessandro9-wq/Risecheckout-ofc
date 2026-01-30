/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * useAdminPagination - Testes Unitários
 * 
 * Testa o hook de paginação reutilizável do módulo Admin.
 * Cobre casos de sucesso, erro e borda.
 * 
 * @version 1.0.0
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAdminPagination } from "../useAdminPagination";

// ============================================
// MOCK DATA
// ============================================

const createMockItems = (count: number) => 
  Array.from({ length: count }, (_, i) => ({ id: `item-${i + 1}` }));

// ============================================
// TESTS: INITIALIZATION
// ============================================

describe("useAdminPagination - Initialization", () => {
  it("should initialize on page 1", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.currentPage).toBe(1);
  });

  it("should calculate total pages correctly", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.totalPages).toBe(4); // 50 / 15 = 3.33 -> 4 pages
  });

  it("should return correct paginated items for first page", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.paginatedItems).toHaveLength(15);
    expect(result.current.paginatedItems[0].id).toBe("item-1");
    expect(result.current.paginatedItems[14].id).toBe("item-15");
  });

  it("should use default items per page (15) when not specified", () => {
    const items = createMockItems(30);
    const { result } = renderHook(() => useAdminPagination(items));

    expect(result.current.paginatedItems).toHaveLength(15);
    expect(result.current.totalPages).toBe(2);
  });

  it("should calculate correct start and end indices", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.startIndex).toBe(1);
    expect(result.current.endIndex).toBe(15);
  });

  it("should return total items count", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.totalItems).toBe(50);
  });
});

// ============================================
// TESTS: NAVIGATION
// ============================================

describe("useAdminPagination - Navigation", () => {
  it("should navigate to specific page with goToPage", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedItems[0].id).toBe("item-31");
  });

  it("should navigate to next page with goToNext", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedItems[0].id).toBe("item-16");
  });

  it("should navigate to previous page with goToPrevious", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it("should reset to page 1 with reset", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it("should not go beyond last page", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(4);
    });

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentPage).toBe(4);
  });

  it("should not go below page 1", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it("should ignore invalid page numbers", () => {
    const items = createMockItems(50);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(0);
    });

    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.goToPage(999);
    });

    expect(result.current.currentPage).toBe(1);
  });
});

// ============================================
// TESTS: PAGE NUMBERS GENERATION
// ============================================

describe("useAdminPagination - Page Numbers", () => {
  it("should show all pages when total is small", () => {
    const items = createMockItems(30);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.pageNumbers).toEqual([1, 2]);
  });

  it("should show ellipsis for large page counts at start", () => {
    const items = createMockItems(150);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.pageNumbers).toContain("ellipsis");
    expect(result.current.pageNumbers).toContain(10);
  });

  it("should show ellipsis for large page counts at end", () => {
    const items = createMockItems(150);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(10);
    });

    expect(result.current.pageNumbers).toContain("ellipsis");
    expect(result.current.pageNumbers).toContain(1);
  });

  it("should show ellipsis on both sides for middle pages", () => {
    const items = createMockItems(150);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(5);
    });

    const ellipsisCount = result.current.pageNumbers.filter(p => p === "ellipsis").length;
    expect(ellipsisCount).toBe(2);
  });
});

// ============================================
// TESTS: LAST PAGE HANDLING
// ============================================

describe("useAdminPagination - Last Page", () => {
  it("should show correct items on last page with partial items", () => {
    const items = createMockItems(47);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(4);
    });

    expect(result.current.paginatedItems).toHaveLength(2);
    expect(result.current.paginatedItems[0].id).toBe("item-46");
    expect(result.current.paginatedItems[1].id).toBe("item-47");
  });

  it("should calculate correct end index on last page", () => {
    const items = createMockItems(47);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    act(() => {
      result.current.goToPage(4);
    });

    expect(result.current.endIndex).toBe(47);
  });
});

// ============================================
// TESTS: DYNAMIC ITEMS CHANGES
// ============================================

describe("useAdminPagination - Dynamic Items", () => {
  it("should reset to valid page when items decrease", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAdminPagination(items, 15),
      { initialProps: { items: createMockItems(50) } }
    );

    act(() => {
      result.current.goToPage(4);
    });

    rerender({ items: createMockItems(20) });

    expect(result.current.currentPage).toBe(2);
  });

  it("should recalculate total pages when items change", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAdminPagination(items, 15),
      { initialProps: { items: createMockItems(50) } }
    );

    expect(result.current.totalPages).toBe(4);

    rerender({ items: createMockItems(100) });

    expect(result.current.totalPages).toBe(7);
  });

  it("should update paginated items when source items change", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useAdminPagination(items, 15),
      { initialProps: { items: createMockItems(30) } }
    );

    expect(result.current.paginatedItems).toHaveLength(15);

    rerender({ items: createMockItems(10) });

    expect(result.current.paginatedItems).toHaveLength(10);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("useAdminPagination - Edge Cases", () => {
  it("should handle empty items array", () => {
    const { result } = renderHook(() => useAdminPagination([], 15));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedItems).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it("should handle single item", () => {
    const items = createMockItems(1);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedItems).toHaveLength(1);
  });

  it("should handle exact multiple of items per page", () => {
    const items = createMockItems(45);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.totalPages).toBe(3);

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.paginatedItems).toHaveLength(15);
  });

  it("should handle very large item counts", () => {
    const items = createMockItems(10000);
    const { result } = renderHook(() => useAdminPagination(items, 15));

    expect(result.current.totalPages).toBe(667);
    expect(result.current.paginatedItems).toHaveLength(15);
  });

  it("should handle items per page of 1", () => {
    const items = createMockItems(5);
    const { result } = renderHook(() => useAdminPagination(items, 1));

    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedItems).toHaveLength(1);
  });
});
