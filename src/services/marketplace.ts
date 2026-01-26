/**
 * Marketplace Service
 * 
 * RISE ARCHITECT PROTOCOL V3 - API Gateway Architecture (10.0/10)
 * 
 * Uses api.call() and api.publicCall() via Cloudflare Worker.
 * Zero secrets in frontend. Zero direct database access.
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 */

import type { Database } from "@/integrations/supabase/types";
import { api } from "@/lib/api";
import { publicApi } from "@/lib/api/public-client";
import { incrementMarketplaceViewRpc, incrementMarketplaceClickRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger("Marketplace");

// Types
type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];
type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

export type MarketplaceFilters = {
  category?: string;
  search?: string;
  minCommission?: number;
  maxCommission?: number;
  sortBy?: "recent" | "popular" | "commission";
  limit?: number;
  offset?: number;
  // Filtros de aprovação
  approvalImmediate?: boolean;
  approvalModeration?: boolean;
  // Filtros de tipo de produto (por categoria/tag)
  typeEbook?: boolean;
  typeService?: boolean;
  typeCourse?: boolean;
};

export type MarketplaceProductWithDetails = MarketplaceProduct & {
  category_info?: MarketplaceCategory | null;
};

interface MarketplaceProductsResponse {
  products?: MarketplaceProductWithDetails[];
  error?: string;
}

interface MarketplaceProductResponse {
  product?: MarketplaceProductWithDetails | null;
  error?: string;
}

interface MarketplaceCategoriesResponse {
  categories?: MarketplaceCategory[];
  error?: string;
}

/**
 * Busca produtos do marketplace com filtros
 * Uses api.publicCall for public marketplace data
 */
export async function fetchMarketplaceProducts(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceProductWithDetails[]> {
  try {
    const { data, error } = await publicApi.call<MarketplaceProductsResponse>("marketplace-public", {
      action: "get-products",
      filters,
    });

    if (error) {
      log.error("Erro ao buscar produtos:", error);
      throw new Error(error.message);
    }

    return data?.products || [];
  } catch (error: unknown) {
    log.error("Erro ao buscar produtos:", error);
    throw error;
  }
}

/**
 * Busca detalhes de um produto específico do marketplace
 * Uses api.publicCall for public product details
 */
export async function fetchProductDetails(
  productId: string
): Promise<MarketplaceProductWithDetails | null> {
  try {
    const { data, error } = await publicApi.call<MarketplaceProductResponse>("marketplace-public", {
      action: "get-product",
      productId,
    });

    if (error) {
      log.error("Erro ao buscar detalhes do produto:", error);
      throw new Error(error.message);
    }

    return data?.product || null;
  } catch (error: unknown) {
    log.error("Erro ao buscar detalhes do produto:", error);
    throw error;
  }
}

/**
 * Busca todas as categorias do marketplace
 * Uses api.publicCall for public categories
 */
export async function fetchMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  try {
    const { data, error } = await publicApi.call<MarketplaceCategoriesResponse>("marketplace-public", {
      action: "get-categories",
    });

    if (error) {
      log.error("Erro ao buscar categorias:", error);
      throw new Error(error.message);
    }

    return data?.categories || [];
  } catch (error: unknown) {
    log.error("Erro ao buscar categorias:", error);
    throw error;
  }
}

/**
 * Incrementa a contagem de visualizações de um produto
 */
export async function trackProductView(productId: string): Promise<void> {
  try {
    const { error } = await incrementMarketplaceViewRpc(productId);

    if (error) {
      log.warn("Erro ao rastrear visualização:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error: unknown) {
    log.warn("Erro ao rastrear visualização:", error);
    // Não lançar erro para não bloquear a UI
  }
}

/**
 * Incrementa a contagem de cliques de um produto
 */
export async function trackProductClick(productId: string): Promise<void> {
  try {
    const { error } = await incrementMarketplaceClickRpc(productId);

    if (error) {
      log.warn("Erro ao rastrear clique:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error: unknown) {
    log.warn("Erro ao rastrear clique:", error);
    // Não lançar erro para não bloquear a UI
  }
}

interface AffiliationStatusResponse {
  isAffiliate: boolean;
  status?: "pending" | "active" | "rejected" | "blocked";
  affiliationId?: string;
}

/**
 * Verifica se o usuário já é afiliado de um produto
 * Uses api.call() for authenticated affiliation check
 */
export async function checkAffiliationStatus(
  productId: string
): Promise<{
  isAffiliate: boolean;
  status?: "pending" | "active" | "rejected" | "blocked";
  affiliationId?: string;
}> {
  try {
    const { data, error } = await api.call<AffiliationStatusResponse>("get-affiliation-status", {
      product_id: productId,
    });

    if (error) {
      // Se não autenticado, retorna não afiliado
      if (error.code === "UNAUTHORIZED") {
        log.debug("Sem token de sessão - usuário não logado");
        return { isAffiliate: false };
      }
      log.error("Erro ao verificar status de afiliação:", error);
      return { isAffiliate: false };
    }

    return {
      isAffiliate: data?.isAffiliate || false,
      status: data?.status,
      affiliationId: data?.affiliationId,
    };
  } catch (error: unknown) {
    log.error("Erro ao verificar status de afiliação:", error);
    return { isAffiliate: false };
  }
}
