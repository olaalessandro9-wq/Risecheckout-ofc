/**
 * Marketplace Service
 * 
 * MIGRATED: Uses Edge Function instead of direct database access
 * @see RISE Protocol V2 - Zero direct database access from frontend
 */

import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import { incrementMarketplaceViewRpc, incrementMarketplaceClickRpc } from "@/lib/rpc/rpcProxy";

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

/**
 * Busca produtos do marketplace com filtros
 * MIGRATED: Uses Edge Function
 */
export async function fetchMarketplaceProducts(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceProductWithDetails[]> {
  try {
    const { data, error } = await supabase.functions.invoke("products-crud", {
      body: {
        action: "get-marketplace",
        filters,
      },
    });

    if (error) {
      console.error("[Marketplace] Erro ao buscar produtos:", error);
      throw error;
    }

    return data?.products || [];
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao buscar produtos:", error);
    throw error;
  }
}

/**
 * Busca detalhes de um produto específico do marketplace
 * MIGRATED: Uses Edge Function
 */
export async function fetchProductDetails(
  productId: string
): Promise<MarketplaceProductWithDetails | null> {
  try {
    const { data, error } = await supabase.functions.invoke("products-crud", {
      body: {
        action: "get-marketplace-product",
        productId,
      },
    });

    if (error) {
      console.error("[Marketplace] Erro ao buscar detalhes do produto:", error);
      throw error;
    }

    return data?.product || null;
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao buscar detalhes do produto:", error);
    throw error;
  }
}

/**
 * Busca todas as categorias do marketplace
 * MIGRATED: Uses Edge Function
 */
export async function fetchMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  try {
    const { data, error } = await supabase.functions.invoke("products-crud", {
      body: {
        action: "get-marketplace-categories",
      },
    });

    if (error) {
      console.error("[Marketplace] Erro ao buscar categorias:", error);
      throw error;
    }

    return data?.categories || [];
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao buscar categorias:", error);
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
      console.error("[Marketplace] Erro ao rastrear visualização:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao rastrear visualização:", error);
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
      console.error("[Marketplace] Erro ao rastrear clique:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao rastrear clique:", error);
    // Não lançar erro para não bloquear a UI
  }
}

/**
 * Verifica se o usuário já é afiliado de um produto
 * 
 * MIGRATED: Usa Edge Function para bypass de RLS
 * (sistema usa autenticação customizada via producer_sessions)
 */
export async function checkAffiliationStatus(
  productId: string,
  _userId: string // Mantido para compatibilidade, mas não usado
): Promise<{
  isAffiliate: boolean;
  status?: "pending" | "active" | "rejected" | "blocked";
  affiliationId?: string;
}> {
  try {
    const sessionToken = getProducerSessionToken();

    if (!sessionToken) {
      console.log("[Marketplace] Sem token de sessão - usuário não logado");
      return { isAffiliate: false };
    }

    const { data, error } = await supabase.functions.invoke("get-affiliation-status", {
      body: { product_id: productId },
      headers: {
        "x-producer-session-token": sessionToken,
      },
    });

    if (error) {
      console.error("[Marketplace] Erro ao verificar status de afiliação:", error);
      return { isAffiliate: false };
    }

    // Edge Function retorna { isAffiliate, status?, affiliationId? }
    return {
      isAffiliate: data?.isAffiliate || false,
      status: data?.status,
      affiliationId: data?.affiliationId,
    };
  } catch (error: unknown) {
    console.error("[Marketplace] Erro ao verificar status de afiliação:", error);
    return { isAffiliate: false };
  }
}
