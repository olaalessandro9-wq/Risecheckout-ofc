/**
 * Shared Types & Mock Data for marketplace-public Tests
 * 
 * @module marketplace-public/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type Action = "get-products" | "get-product" | "get-categories";

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  minCommission?: number;
  maxCommission?: number;
  sortBy?: "recent" | "popular" | "commission";
  limit?: number;
  offset?: number;
  approvalImmediate?: boolean;
  approvalModeration?: boolean;
  typeEbook?: boolean;
  typeService?: boolean;
  typeCourse?: boolean;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  marketplace_description: string | null;
  marketplace_category: string | null;
  commission_percentage: number;
  requires_manual_approval: boolean;
  marketplace_tags: string[];
  marketplace_enabled_at: string;
  popularity_score: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const VALID_ACTIONS: Action[] = ["get-products", "get-product", "get-categories"];

export const MOCK_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "prod-1",
    name: "Curso de Marketing",
    marketplace_description: "Aprenda marketing digital",
    marketplace_category: "marketing",
    commission_percentage: 40,
    requires_manual_approval: false,
    marketplace_tags: ["curso", "marketing"],
    marketplace_enabled_at: "2025-01-15T10:00:00Z",
    popularity_score: 100,
  },
  {
    id: "prod-2",
    name: "E-book de Vendas",
    marketplace_description: "Técnicas de vendas",
    marketplace_category: "vendas",
    commission_percentage: 50,
    requires_manual_approval: true,
    marketplace_tags: ["ebook", "vendas"],
    marketplace_enabled_at: "2025-01-20T10:00:00Z",
    popularity_score: 80,
  },
  {
    id: "prod-3",
    name: "Serviço de Consultoria",
    marketplace_description: "Consultoria empresarial",
    marketplace_category: "negocios",
    commission_percentage: 30,
    requires_manual_approval: false,
    marketplace_tags: ["servico"],
    marketplace_enabled_at: "2025-01-10T10:00:00Z",
    popularity_score: 60,
  },
];

export const MOCK_CATEGORIES = [
  { id: "cat-1", name: "Marketing", slug: "marketing", active: true, display_order: 1 },
  { id: "cat-2", name: "Vendas", slug: "vendas", active: true, display_order: 2 },
  { id: "cat-3", name: "Negócios", slug: "negocios", active: true, display_order: 3 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateAction(action: unknown): action is Action {
  if (typeof action !== "string") return false;
  return VALID_ACTIONS.includes(action as Action);
}

export function validateProductId(productId: unknown): boolean {
  return typeof productId === "string" && productId.length > 0;
}

export function filterByCategory(products: MarketplaceProduct[], category: string): MarketplaceProduct[] {
  return products.filter(p => p.marketplace_category === category);
}

export function filterBySearch(products: MarketplaceProduct[], search: string): MarketplaceProduct[] {
  const term = search.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(term) ||
    (p.marketplace_description?.toLowerCase().includes(term) ?? false)
  );
}

export function filterByCommission(
  products: MarketplaceProduct[],
  min?: number,
  max?: number
): MarketplaceProduct[] {
  return products.filter(p => {
    if (min !== undefined && p.commission_percentage < min) return false;
    if (max !== undefined && p.commission_percentage > max) return false;
    return true;
  });
}

export function filterByApproval(
  products: MarketplaceProduct[],
  immediate?: boolean,
  moderation?: boolean
): MarketplaceProduct[] {
  if (immediate && !moderation) {
    return products.filter(p => !p.requires_manual_approval);
  }
  if (moderation && !immediate) {
    return products.filter(p => p.requires_manual_approval);
  }
  return products;
}

export function filterByType(
  products: MarketplaceProduct[],
  typeEbook?: boolean,
  typeService?: boolean,
  typeCourse?: boolean
): MarketplaceProduct[] {
  const activeTypes: string[] = [];
  if (typeEbook) activeTypes.push("ebook");
  if (typeService) activeTypes.push("servico");
  if (typeCourse) activeTypes.push("curso");
  
  if (activeTypes.length === 0 || activeTypes.length === 3) {
    return products;
  }
  
  return products.filter(p => 
    p.marketplace_tags.some(tag => activeTypes.includes(tag))
  );
}

export function sortProducts(products: MarketplaceProduct[], sortBy?: string): MarketplaceProduct[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case "recent":
      return sorted.sort((a, b) => 
        new Date(b.marketplace_enabled_at).getTime() - new Date(a.marketplace_enabled_at).getTime()
      );
    case "popular":
      return sorted.sort((a, b) => b.popularity_score - a.popularity_score);
    case "commission":
      return sorted.sort((a, b) => b.commission_percentage - a.commission_percentage);
    default:
      return sorted.sort((a, b) => 
        new Date(b.marketplace_enabled_at).getTime() - new Date(a.marketplace_enabled_at).getTime()
      );
  }
}

export function paginateProducts(
  products: MarketplaceProduct[],
  limit?: number,
  offset?: number
): MarketplaceProduct[] {
  const startIndex = offset || 0;
  const endIndex = limit ? startIndex + limit : products.length;
  return products.slice(startIndex, endIndex);
}

export function buildErrorResponse(message: string, code: string) {
  return { error: message, code };
}

export function buildProductsResponse(products: MarketplaceProduct[]) {
  return { products };
}
