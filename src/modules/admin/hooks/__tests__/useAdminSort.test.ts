/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * useAdminSort - Testes Unitários
 * 
 * Testa o hook de ordenação reutilizável do módulo Admin.
 * Cobre casos de sucesso, erro e borda, incluindo comparadores pré-definidos.
 * 
 * @version 1.0.0
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { 
  useAdminSort, 
  createUserComparator, 
  createProductComparator 
} from "../useAdminSort";
import type { SortDirection } from "../../types/admin.types";

// ============================================
// MOCK DATA
// ============================================

interface TestUser {
  profile: { name: string } | null;
  total_gmv: number;
  orders_count: number;
}

interface TestProduct {
  name: string;
  total_gmv: number;
  orders_count: number;
  price: number;
  created_at: string | null;
}

const mockUsers: TestUser[] = [
  { profile: { name: "Carlos" }, total_gmv: 50000, orders_count: 10 },
  { profile: { name: "Ana" }, total_gmv: 30000, orders_count: 5 },
  { profile: { name: "Bruno" }, total_gmv: 40000, orders_count: 8 },
  { profile: null, total_gmv: 20000, orders_count: 3 },
];

const mockProducts: TestProduct[] = [
  { name: "Produto C", total_gmv: 15000, orders_count: 20, price: 9900, created_at: "2024-03-01" },
  { name: "Produto A", total_gmv: 25000, orders_count: 30, price: 4900, created_at: "2024-01-01" },
  { name: "Produto B", total_gmv: 20000, orders_count: 25, price: 7900, created_at: "2024-02-01" },
];

type UserSortField = "name" | "gmv" | "orders";
type ProductSortField = "name" | "gmv" | "orders" | "price" | "date";

// ============================================
// TESTS: INITIALIZATION
// ============================================

describe("useAdminSort - Initialization", () => {
  it("should initialize with default field and direction", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should sort items on initialization", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortedItems[0].profile?.name).toBe("Ana");
    expect(result.current.sortedItems[1].profile?.name).toBe("Bruno");
  });

  it("should not mutate original array", () => {
    const comparator = createUserComparator<TestUser>();
    const originalOrder = [...mockUsers];
    
    renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    expect(mockUsers).toEqual(originalOrder);
  });
});

// ============================================
// TESTS: TOGGLE SORT
// ============================================

describe("useAdminSort - Toggle Sort", () => {
  it("should toggle direction when same field", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.toggleSort("name" as UserSortField);
    });

    expect(result.current.sortDirection).toBe("desc");
  });

  it("should change field and set to desc when different field", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.toggleSort("gmv" as UserSortField);
    });

    expect(result.current.sortField).toBe("gmv");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should re-sort items after toggle", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.toggleSort("name" as UserSortField);
    });

    expect(result.current.sortedItems[0].profile?.name).toBe("Carlos");
  });
});

// ============================================
// TESTS: SET SORT
// ============================================

describe("useAdminSort - Set Sort", () => {
  it("should set specific field and direction", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.setSort("gmv" as UserSortField, "asc");
    });

    expect(result.current.sortField).toBe("gmv");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should re-sort items after setSort", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.setSort("gmv" as UserSortField, "desc");
    });

    expect(result.current.sortedItems[0].total_gmv).toBe(50000);
  });
});

// ============================================
// TESTS: RESET SORT
// ============================================

describe("useAdminSort - Reset Sort", () => {
  it("should reset to default field and direction", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.setSort("gmv" as UserSortField, "desc");
    });

    act(() => {
      result.current.resetSort();
    });

    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should re-sort items after reset", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    act(() => {
      result.current.setSort("gmv" as UserSortField, "desc");
    });

    act(() => {
      result.current.resetSort();
    });

    expect(result.current.sortedItems[0].profile?.name).toBe("Ana");
  });
});

// ============================================
// TESTS: USER COMPARATOR
// ============================================

describe("createUserComparator", () => {
  it("should sort by name ascending", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    const names = result.current.sortedItems.map(u => u.profile?.name || "");
    expect(names).toEqual(["", "Ana", "Bruno", "Carlos"]);
  });

  it("should sort by name descending", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "desc", comparator)
    );

    const names = result.current.sortedItems.map(u => u.profile?.name || "");
    expect(names).toEqual(["Carlos", "Bruno", "Ana", ""]);
  });

  it("should sort by gmv ascending", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "gmv" as UserSortField, "asc", comparator)
    );

    const gmvs = result.current.sortedItems.map(u => u.total_gmv);
    expect(gmvs).toEqual([20000, 30000, 40000, 50000]);
  });

  it("should sort by gmv descending", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "gmv" as UserSortField, "desc", comparator)
    );

    const gmvs = result.current.sortedItems.map(u => u.total_gmv);
    expect(gmvs).toEqual([50000, 40000, 30000, 20000]);
  });

  it("should sort by orders count", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "orders" as UserSortField, "asc", comparator)
    );

    const orders = result.current.sortedItems.map(u => u.orders_count);
    expect(orders).toEqual([3, 5, 8, 10]);
  });

  it("should handle null profiles", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(mockUsers, "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortedItems).toHaveLength(4);
  });
});

// ============================================
// TESTS: PRODUCT COMPARATOR
// ============================================

describe("createProductComparator", () => {
  it("should sort by name ascending", () => {
    const comparator = createProductComparator<TestProduct>();
    const { result } = renderHook(() =>
      useAdminSort(mockProducts, "name" as ProductSortField, "asc", comparator)
    );

    const names = result.current.sortedItems.map(p => p.name);
    expect(names).toEqual(["Produto A", "Produto B", "Produto C"]);
  });

  it("should sort by gmv descending", () => {
    const comparator = createProductComparator<TestProduct>();
    const { result } = renderHook(() =>
      useAdminSort(mockProducts, "gmv" as ProductSortField, "desc", comparator)
    );

    const gmvs = result.current.sortedItems.map(p => p.total_gmv);
    expect(gmvs).toEqual([25000, 20000, 15000]);
  });

  it("should sort by price ascending", () => {
    const comparator = createProductComparator<TestProduct>();
    const { result } = renderHook(() =>
      useAdminSort(mockProducts, "price" as ProductSortField, "asc", comparator)
    );

    const prices = result.current.sortedItems.map(p => p.price);
    expect(prices).toEqual([4900, 7900, 9900]);
  });

  it("should sort by date ascending", () => {
    const comparator = createProductComparator<TestProduct>();
    const { result } = renderHook(() =>
      useAdminSort(mockProducts, "date" as ProductSortField, "asc", comparator)
    );

    const dates = result.current.sortedItems.map(p => p.created_at);
    expect(dates).toEqual(["2024-01-01", "2024-02-01", "2024-03-01"]);
  });

  it("should sort by orders count", () => {
    const comparator = createProductComparator<TestProduct>();
    const { result } = renderHook(() =>
      useAdminSort(mockProducts, "orders" as ProductSortField, "desc", comparator)
    );

    const orders = result.current.sortedItems.map(p => p.orders_count);
    expect(orders).toEqual([30, 25, 20]);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("useAdminSort - Edge Cases", () => {
  it("should handle empty array", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort([], "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortedItems).toHaveLength(0);
  });

  it("should handle single item", () => {
    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort([mockUsers[0]], "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortedItems).toHaveLength(1);
  });

  it("should handle items with equal sort values", () => {
    const duplicateUsers = [
      { profile: { name: "João" }, total_gmv: 10000, orders_count: 5 },
      { profile: { name: "João" }, total_gmv: 10000, orders_count: 5 },
    ];

    const comparator = createUserComparator<TestUser>();
    const { result } = renderHook(() =>
      useAdminSort(duplicateUsers, "name" as UserSortField, "asc", comparator)
    );

    expect(result.current.sortedItems).toHaveLength(2);
  });

  it("should handle dynamic items changes", () => {
    const comparator = createUserComparator<TestUser>();
    const { result, rerender } = renderHook(
      ({ items }) => useAdminSort(items, "name" as UserSortField, "asc", comparator),
      { initialProps: { items: mockUsers } }
    );

    expect(result.current.sortedItems).toHaveLength(4);

    rerender({ items: mockUsers.slice(0, 2) });

    expect(result.current.sortedItems).toHaveLength(2);
  });
});
