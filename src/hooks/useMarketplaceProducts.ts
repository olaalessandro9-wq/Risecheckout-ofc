import { useState, useEffect, useCallback } from "react";
import {
  fetchMarketplaceProducts,
  fetchMarketplaceCategories,
  type MarketplaceFilters,
  type MarketplaceProductWithDetails,
} from "@/services/marketplace";
import { useAffiliationStatusCache } from "@/hooks/useAffiliationStatusCache";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface UseMarketplaceProductsReturn {
  products: MarketplaceProductWithDetails[];
  categories: MarketplaceCategory[];
  filters: MarketplaceFilters;
  setFilters: (filters: MarketplaceFilters) => void;
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

const DEFAULT_LIMIT = 12;

/**
 * Hook para gerenciar produtos do marketplace
 * 
 * Features:
 * - Busca produtos com filtros
 * - Paginação infinita
 * - Cache de categorias
 * - Refetch manual
 */
export function useMarketplaceProducts(): UseMarketplaceProductsReturn {
  const [products, setProducts] = useState<MarketplaceProductWithDetails[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    sortBy: "recent",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Hook de cache de status de afiliação
  const { loadStatuses } = useAffiliationStatusCache();

  // Carregar cache de afiliações ao montar (paralelo aos produtos)
  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  // Buscar categorias (apenas uma vez)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchMarketplaceCategories();
        setCategories(data);
      } catch (err) {
        console.error("[useMarketplaceProducts] Erro ao carregar categorias:", err);
        // Não bloquear a UI se categorias falharem
      }
    };

    loadCategories();
  }, []);

  // Buscar produtos
  const loadProducts = useCallback(async (resetList = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentFilters = resetList
        ? { ...filters, offset: 0 }
        : filters;

      const data = await fetchMarketplaceProducts(currentFilters);

      if (resetList) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }

      // Verificar se há mais produtos
      setHasMore(data.length === (currentFilters.limit || DEFAULT_LIMIT));
    } catch (err) {
      console.error("[useMarketplaceProducts] Erro ao carregar produtos:", err);
      setError(err instanceof Error ? err : new Error("Erro ao carregar produtos"));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Carregar produtos quando filtros mudarem
  useEffect(() => {
    loadProducts(true);
  }, [
    filters.category,
    filters.search,
    filters.minCommission,
    filters.maxCommission,
    filters.sortBy,
    filters.approvalImmediate,
    filters.approvalModeration,
    filters.typeEbook,
    filters.typeService,
    filters.typeCourse,
  ]);

  // Carregar mais produtos (paginação)
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setFilters((prev) => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || DEFAULT_LIMIT),
      }));
    }
  }, [isLoading, hasMore]);

  // Refetch manual
  const refetch = useCallback(() => {
    loadProducts(true);
  }, [loadProducts]);

  // Atualizar filtros
  const handleSetFilters = useCallback((newFilters: MarketplaceFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset offset ao mudar filtros
    }));
  }, []);

  return {
    products,
    categories,
    filters,
    setFilters: handleSetFilters,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
