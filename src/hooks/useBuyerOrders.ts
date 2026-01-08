import { useState, useCallback } from "react";
import { getBuyerSessionToken } from "./useBuyerAuth";
import { SUPABASE_URL } from "@/config/supabase";

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

interface UseBuyerOrdersReturn {
  orders: BuyerOrder[];
  access: BuyerAccess[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchAccess: () => Promise<void>;
  fetchProductContent: (productId: string) => Promise<ProductContent | null>;
}

export function useBuyerOrders(): UseBuyerOrdersReturn {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [access, setAccess] = useState<BuyerAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => {
    const token = getBuyerSessionToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { "x-buyer-session": token } : {}),
    };
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-orders/orders`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar pedidos");
      }

      setOrders(data.orders || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("[useBuyerOrders] Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-orders/access`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar acessos");
      }

      setAccess(data.access || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("[useBuyerOrders] Error fetching access:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductContent = useCallback(async (productId: string): Promise<ProductContent | null> => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/buyer-orders/content?productId=${productId}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar conteúdo");
      }

      return data;
    } catch (err) {
      console.error("[useBuyerOrders] Error fetching content:", err);
      return null;
    }
  }, []);

  return {
    orders,
    access,
    isLoading,
    error,
    fetchOrders,
    fetchAccess,
    fetchProductContent,
  };
}
