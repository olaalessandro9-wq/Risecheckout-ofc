/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * useMarketplaceFilters - Testes Unitários
 * 
 * Testa o hook de gerenciamento de filtros do marketplace.
 * Cobre estado inicial, atualização de filtros, clear, e contagem de filtros ativos.
 * 
 * @version 1.0.0
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMarketplaceFilters } from "../useMarketplaceFilters";
import type { MarketplaceFilters } from "@/services/marketplace";

const mockOnFiltersChange = vi.fn();

describe("useMarketplaceFilters - Initial State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty search input", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.searchInput).toBe("");
  });

  it("should initialize with provided search value", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { search: "test" }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.searchInput).toBe("test");
  });

  it("should have zero active filters initially", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(0);
  });
});

describe("useMarketplaceFilters - Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update search input", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.setSearchInput("new query");
    });
    
    expect(result.current.searchInput).toBe("new query");
  });

  it("should call onFiltersChange when handleSearch", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.setSearchInput("test");
      result.current.handleSearch();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should clear search input", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { search: "test" }, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleClearSearch();
    });
    
    expect(result.current.searchInput).toBe("");
  });

  it("should call onFiltersChange when clearing search", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { search: "test" }, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleClearSearch();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});

describe("useMarketplaceFilters - Clear All", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear all filters", () => {
    const filters: MarketplaceFilters = {
      category: "cat-1",
      search: "test",
      minCommission: 10,
      maxCommission: 50,
      approvalImmediate: true,
      typeEbook: true,
    };
    
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleClearAll();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: undefined,
      search: undefined,
      minCommission: undefined,
      maxCommission: undefined,
      sortBy: "recent",
      approvalImmediate: undefined,
      approvalModeration: undefined,
      typeEbook: undefined,
      typeService: undefined,
      typeCourse: undefined,
    });
  });

  it("should clear search input when clearing all", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { search: "test" }, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleClearAll();
    });
    
    expect(result.current.searchInput).toBe("");
  });
});

describe("useMarketplaceFilters - Approval Change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle immediate approval change", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleApprovalChange("immediate", true);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should handle moderation approval change", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleApprovalChange("moderation", true);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should uncheck immediate approval", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { approvalImmediate: true }, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleApprovalChange("immediate", false);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});

describe("useMarketplaceFilters - Type Change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle ebook type change", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleTypeChange("ebook", true);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should handle service type change", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleTypeChange("service", true);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should handle course type change", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleTypeChange("course", true);
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});

describe("useMarketplaceFilters - Select All", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should select all approvals when none selected", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleSelectAllApproval();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should deselect all approvals when all selected", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ 
        filters: { approvalImmediate: true, approvalModeration: true }, 
        onFiltersChange: mockOnFiltersChange 
      })
    );
    
    act(() => {
      result.current.handleSelectAllApproval();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should select all types when none selected", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: {}, onFiltersChange: mockOnFiltersChange })
    );
    
    act(() => {
      result.current.handleSelectAllTypes();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it("should deselect all types when all selected", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ 
        filters: { typeEbook: true, typeService: true, typeCourse: true }, 
        onFiltersChange: mockOnFiltersChange 
      })
    );
    
    act(() => {
      result.current.handleSelectAllTypes();
    });
    
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });
});

describe("useMarketplaceFilters - Active Filters Count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should count category filter", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { category: "cat-1" }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it("should count search filter", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { search: "test" }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it("should count commission filters", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { minCommission: 10, maxCommission: 50 }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(2);
  });

  it("should not count recent sortBy", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { sortBy: "recent" }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(0);
  });

  it("should count non-recent sortBy", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ filters: { sortBy: "commission" }, onFiltersChange: mockOnFiltersChange })
    );
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it("should count multiple filters", () => {
    const { result } = renderHook(() =>
      useMarketplaceFilters({ 
        filters: { 
          category: "cat-1", 
          search: "test", 
          approvalImmediate: true,
          typeEbook: true 
        }, 
        onFiltersChange: mockOnFiltersChange 
      })
    );
    expect(result.current.activeFiltersCount).toBe(4);
  });
});
