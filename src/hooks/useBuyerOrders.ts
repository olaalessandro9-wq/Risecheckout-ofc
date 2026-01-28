/**
 * useBuyerOrders - Buyer orders and content access hooks
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("BuyerOrders");

interface BuyerOrder {
  id: string;
  product_id: string;
  product_name: string;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    members_area_enabled: boolean;
  } | null;
}

interface BuyerAccess {
  id: string;
  product_id: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  access_type: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    members_area_enabled: boolean;
  } | null;
}

/** Content type for buyer view - supports mixed content (Kiwify-style) */
type BuyerContentType = "mixed" | "video" | "pdf" | "link" | "text" | "download";

interface BuilderSection {
  id: string;
  product_id: string;
  type: string;
  title: string | null;
  position: number;
  settings: Record<string, unknown>;
  is_active: boolean;
}

interface ProductContent {
  product: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    settings: Record<string, unknown>;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    cover_image_url?: string | null;
    contents: Array<{
      id: string;
      title: string;
      description: string | null;
      content_type: BuyerContentType;
      content_url: string | null;
      body: string | null;
      content_data: Record<string, unknown>;
      position: number;
    }>;
  }>;
  sections: BuilderSection[];
}

// Constantes de cache - 5 minutos para dados que mudam pouco
const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos

// RISE V3: Headers simples - cookies httpOnly são enviados automaticamente
const getHeaders = () => ({
  "Content-Type": "application/json",
});

// Fetch functions separadas para React Query
async function fetchBuyerOrders(): Promise<BuyerOrder[]> {
  // RISE V3: credentials: include envia cookies httpOnly automaticamente
  const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-orders/orders`, {
    method: "GET",
    headers: getHeaders(),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao buscar pedidos");
  }

  return data.orders || [];
}

async function fetchBuyerAccess(): Promise<BuyerAccess[]> {
  // RISE V3: credentials: include envia cookies httpOnly automaticamente
  const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-orders/access`, {
    method: "GET",
    headers: getHeaders(),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao buscar acessos");
  }

  return data.access || [];
}

async function fetchBuyerProductContent(productId: string, viewport: 'desktop' | 'mobile' = 'desktop'): Promise<ProductContent | null> {
  // RISE V3: credentials: include envia cookies httpOnly automaticamente
  // RISE V3: Pass viewport to filter sections by device type
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/buyer-orders/content?productId=${productId}&viewport=${viewport}`,
    {
      method: "GET",
      headers: getHeaders(),
      credentials: 'include',
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao buscar conteúdo");
  }

  return data;
}

// Query Keys centralizadas
export const buyerQueryKeys = {
  all: ["buyer"] as const,
  orders: () => [...buyerQueryKeys.all, "orders"] as const,
  access: () => [...buyerQueryKeys.all, "access"] as const,
  content: (productId: string, viewport: 'desktop' | 'mobile') => [...buyerQueryKeys.all, "content", productId, viewport] as const,
};

// Hook principal com React Query
export function useBuyerOrders() {
  const queryClient = useQueryClient();

  // Query para pedidos
  const ordersQuery = useQuery({
    queryKey: buyerQueryKeys.orders(),
    queryFn: fetchBuyerOrders,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
  });

  // Query para acessos
  const accessQuery = useQuery({
    queryKey: buyerQueryKeys.access(),
    queryFn: fetchBuyerAccess,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
  });

  // Função para buscar conteúdo de um produto (usa cache)
  const fetchProductContent = async (productId: string, viewport: 'desktop' | 'mobile' = 'desktop'): Promise<ProductContent | null> => {
    try {
      return await queryClient.fetchQuery({
        queryKey: buyerQueryKeys.content(productId, viewport),
        queryFn: () => fetchBuyerProductContent(productId, viewport),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
      });
    } catch (err) {
      log.error("Error fetching content", err);
      return null;
    }
  };

  // Funções de refetch para manter compatibilidade
  const fetchOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: buyerQueryKeys.orders() });
  };

  const fetchAccess = async () => {
    await queryClient.invalidateQueries({ queryKey: buyerQueryKeys.access() });
  };

  return {
    orders: ordersQuery.data ?? [],
    access: accessQuery.data ?? [],
    isLoading: ordersQuery.isLoading || accessQuery.isLoading,
    error: ordersQuery.error?.message || accessQuery.error?.message || null,
    fetchOrders,
    fetchAccess,
    fetchProductContent,
  };
}

// Hook específico para conteúdo de produto com cache
// RISE V3: Accepts viewport parameter to filter sections
export function useBuyerProductContent(productId: string | undefined, viewport: 'desktop' | 'mobile' = 'desktop') {
  return useQuery({
    queryKey: productId ? buyerQueryKeys.content(productId, viewport) : ["disabled"],
    queryFn: () => fetchBuyerProductContent(productId!, viewport),
    enabled: !!productId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
  });
}

// Hook específico para acessos (para uso direto)
export function useBuyerAccessQuery() {
  return useQuery({
    queryKey: buyerQueryKeys.access(),
    queryFn: fetchBuyerAccess,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 1,
  });
}
