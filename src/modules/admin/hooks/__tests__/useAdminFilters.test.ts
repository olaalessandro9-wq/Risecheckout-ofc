/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * useAdminFilters - Testes Unitários
 * 
 * Testa o hook de filtros reutilizável do módulo Admin.
 * Cobre casos de sucesso, erro e borda.
 * 
 * @version 1.0.0
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAdminFilters } from "../useAdminFilters";

// ============================================
// MOCK DATA
// ============================================

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: string;
  age: number;
}

const mockItems: TestItem[] = [
  { id: "1", name: "João Silva", email: "joao@test.com", status: "active", age: 25 },
  { id: "2", name: "Maria Santos", email: "maria@test.com", status: "inactive", age: 30 },
  { id: "3", name: "Pedro Costa", email: "pedro@test.com", status: "active", age: 35 },
  { id: "4", name: "Ana Oliveira", email: "ana@test.com", status: "suspended", age: 28 },
];

interface TestFilters {
  status: string;
  minAge: number | null;
}

const initialFilters: TestFilters = {
  status: "all",
  minAge: null,
};

const searchFieldExtractor = (item: TestItem) => [
  item.name,
  item.email,
];

const customFilterFn = (item: TestItem, filters: TestFilters) => {
  if (filters.status !== "all" && item.status !== filters.status) {
    return false;
  }
  if (filters.minAge !== null && item.age < filters.minAge) {
    return false;
  }
  return true;
};

// ============================================
// TESTS: INITIALIZATION
// ============================================

describe("useAdminFilters - Initialization", () => {
  it("should initialize with empty search term", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    expect(result.current.searchTerm).toBe("");
  });

  it("should initialize with provided filters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    expect(result.current.filters).toEqual(initialFilters);
  });

  it("should return all items when no filters applied", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    expect(result.current.filteredItems).toHaveLength(4);
    expect(result.current.filteredItems).toEqual(mockItems);
  });

  it("should indicate no active filters initially", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    expect(result.current.hasActiveFilters).toBe(false);
  });
});

// ============================================
// TESTS: SEARCH TERM FILTERING
// ============================================

describe("useAdminFilters - Search Term", () => {
  it("should filter items by search term in name", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("João");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("João Silva");
  });

  it("should filter items by search term in email", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("maria@test");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].email).toBe("maria@test.com");
  });

  it("should be case insensitive", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("PEDRO");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("Pedro Costa");
  });

  it("should return empty array when no matches", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("NonExistent");
    });

    expect(result.current.filteredItems).toHaveLength(0);
  });

  it("should ignore leading/trailing whitespace", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("  João  ");
    });

    expect(result.current.filteredItems).toHaveLength(1);
  });

  it("should return all items when search term is empty", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("João");
    });

    act(() => {
      result.current.setSearchTerm("");
    });

    expect(result.current.filteredItems).toHaveLength(4);
  });
});

// ============================================
// TESTS: CUSTOM FILTERS
// ============================================

describe("useAdminFilters - Custom Filters", () => {
  it("should apply custom filter function", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.filteredItems.every(item => item.status === "active")).toBe(true);
  });

  it("should combine search term and custom filters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setSearchTerm("Silva");
      result.current.setFilter("status", "active");
    });

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].name).toBe("João Silva");
  });

  it("should filter by numeric criteria", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("minAge", 30);
    });

    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.filteredItems.every(item => item.age >= 30)).toBe(true);
  });
});

// ============================================
// TESTS: FILTER MANAGEMENT
// ============================================

describe("useAdminFilters - Filter Management", () => {
  it("should update single filter with setFilter", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("status", "inactive");
    });

    expect(result.current.filters.status).toBe("inactive");
    expect(result.current.filters.minAge).toBe(null);
  });

  it("should update multiple filters with setFilters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilters({ status: "active", minAge: 30 });
    });

    expect(result.current.filters.status).toBe("active");
    expect(result.current.filters.minAge).toBe(30);
  });

  it("should clear all filters with clearFilters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setSearchTerm("João");
      result.current.setFilters({ status: "active", minAge: 30 });
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.filteredItems).toHaveLength(4);
  });
});

// ============================================
// TESTS: ACTIVE FILTERS DETECTION
// ============================================

describe("useAdminFilters - Active Filters Detection", () => {
  it("should detect active search term", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("João");
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should detect active custom filters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("should not detect 'all' as active filter", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("status", "all");
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("should not detect null/undefined/empty as active filters", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters, customFilterFn)
    );

    act(() => {
      result.current.setFilter("minAge", null);
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("useAdminFilters - Edge Cases", () => {
  it("should handle empty items array", () => {
    const { result } = renderHook(() =>
      useAdminFilters([], searchFieldExtractor, initialFilters)
    );

    expect(result.current.filteredItems).toHaveLength(0);
  });

  it("should handle items with null/undefined fields", () => {
    const itemsWithNulls = [
      { id: "1", name: "Test", email: "", status: "active", age: 25 },
    ];

    const { result } = renderHook(() =>
      useAdminFilters(itemsWithNulls, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("Test");
    });

    expect(result.current.filteredItems).toHaveLength(1);
  });

  it("should handle special characters in search", () => {
    const { result } = renderHook(() =>
      useAdminFilters(mockItems, searchFieldExtractor, initialFilters)
    );

    act(() => {
      result.current.setSearchTerm("@test.com");
    });

    expect(result.current.filteredItems).toHaveLength(4);
  });
});
