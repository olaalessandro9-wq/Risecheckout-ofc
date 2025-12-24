/**
 * MarketplaceGrid - Grid de Produtos
 * 
 * Grid responsivo com infinite scroll
 */

import { useEffect, useRef } from "react";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./EmptyState";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

interface MarketplaceGridProps {
  products: MarketplaceProduct[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onViewDetails: (productId: string) => void;
  onPromote: (productId: string) => void;
}

export function MarketplaceGrid({
  products,
  isLoading,
  hasMore,
  onLoadMore,
  onViewDetails,
  onPromote,
}: MarketplaceGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll com Intersection Observer
  useEffect(() => {
    if (isLoading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, hasMore, onLoadMore]);

  // Loading inicial
  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    return <EmptyState type="no-results" />;
  }

  return (
    <div className="space-y-6">
      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={onViewDetails}
            onPromote={onPromote}
          />
        ))}
      </div>

      {/* Loading More */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {isLoading && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Fim dos resultados */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Você viu todos os produtos disponíveis
        </div>
      )}
    </div>
  );
}
