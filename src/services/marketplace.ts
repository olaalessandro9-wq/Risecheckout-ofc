import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

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
 */
export async function fetchMarketplaceProducts(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceProductWithDetails[]> {
  try {
    let query = supabase
      .from("marketplace_products")
      .select("*");

    // Filtro de categoria
    if (filters.category) {
      query = query.eq("marketplace_category", filters.category);
    }

    // Filtro de busca (nome ou descrição)
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,marketplace_description.ilike.%${filters.search}%`
      );
    }

    // Filtro de comissão mínima
    if (filters.minCommission) {
      query = query.gte("commission_percentage", filters.minCommission);
    }

    // Filtro de comissão máxima
    if (filters.maxCommission) {
      query = query.lte("commission_percentage", filters.maxCommission);
    }

    // Filtro de aprovação
    const approvalFilters: string[] = [];
    if (filters.approvalImmediate) {
      approvalFilters.push("requires_manual_approval.eq.false");
    }
    if (filters.approvalModeration) {
      approvalFilters.push("requires_manual_approval.eq.true");
    }
    // Aplica apenas se algum filtro estiver ativo (não ambos ou nenhum)
    if (approvalFilters.length === 1) {
      query = query.or(approvalFilters[0]);
    }

    // Filtro de tipo de produto (baseado em tags do marketplace)
    const typeFilters: string[] = [];
    if (filters.typeEbook) {
      typeFilters.push("marketplace_tags.cs.{ebook}");
    }
    if (filters.typeService) {
      typeFilters.push("marketplace_tags.cs.{servico}");
    }
    if (filters.typeCourse) {
      typeFilters.push("marketplace_tags.cs.{curso}");
    }
    // Aplica OR entre os tipos selecionados
    if (typeFilters.length > 0 && typeFilters.length < 3) {
      query = query.or(typeFilters.join(","));
    }

    // Ordenação
    switch (filters.sortBy) {
      case "recent":
        query = query.order("marketplace_enabled_at", { ascending: false });
        break;
      case "popular":
        query = query.order("popularity_score", { ascending: false });
        break;
      case "commission":
        query = query.order("commission_percentage", { ascending: false });
        break;
      default:
        query = query.order("marketplace_enabled_at", { ascending: false });
    }

    // Paginação
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Marketplace] Erro ao buscar produtos:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[Marketplace] Erro ao buscar produtos:", error);
    throw error;
  }
}

/**
 * Busca detalhes de um produto específico do marketplace
 */
export async function fetchProductDetails(
  productId: string
): Promise<MarketplaceProductWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) {
      console.error("[Marketplace] Erro ao buscar detalhes do produto:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[Marketplace] Erro ao buscar detalhes do produto:", error);
    throw error;
  }
}

/**
 * Busca todas as categorias do marketplace
 */
export async function fetchMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  try {
    const { data, error } = await supabase
      .from("marketplace_categories")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[Marketplace] Erro ao buscar categorias:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[Marketplace] Erro ao buscar categorias:", error);
    throw error;
  }
}

/**
 * Incrementa a contagem de visualizações de um produto
 */
export async function trackProductView(productId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_marketplace_view", {
      p_product_id: productId,
    });

    if (error) {
      console.error("[Marketplace] Erro ao rastrear visualização:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error) {
    console.error("[Marketplace] Erro ao rastrear visualização:", error);
    // Não lançar erro para não bloquear a UI
  }
}

/**
 * Incrementa a contagem de cliques de um produto
 */
export async function trackProductClick(productId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_marketplace_click", {
      p_product_id: productId,
    });

    if (error) {
      console.error("[Marketplace] Erro ao rastrear clique:", error);
      // Não lançar erro para não bloquear a UI
    }
  } catch (error) {
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
  } catch (error) {
    console.error("[Marketplace] Erro ao verificar status de afiliação:", error);
    return { isAffiliate: false };
  }
}
