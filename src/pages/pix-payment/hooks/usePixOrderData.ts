/**
 * usePixOrderData - Hook para buscar dados do pedido via RPC
 * 
 * Responsabilidade ÚNICA: Buscar e retornar dados do pedido
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import type { OrderDataFromRpc } from "../types";

interface UsePixOrderDataReturn {
  orderData: OrderDataFromRpc | null;
  loading: boolean;
  error: string | null;
  fetchOrderData: () => Promise<void>;
}

export function usePixOrderData(
  orderId: string | undefined,
  accessToken: string | undefined
): UsePixOrderDataReturn {
  const [orderData, setOrderData] = useState<OrderDataFromRpc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderData = useCallback(async (retryCount = 0) => {
    if (!accessToken) {
      console.error("[usePixOrderData] ⚠️ Sem access_token");
      toast.error("Token de acesso não encontrado");
      setError("Token de acesso não encontrado");
      return;
    }

    if (!orderId) {
      console.error("[usePixOrderData] ⚠️ Sem orderId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[usePixOrderData] Buscando pedido via RPC (tentativa ${retryCount + 1}):`, orderId);
      
      const { data: order, error: rpcError } = await getOrderForPaymentRpc(orderId, accessToken);

      if (rpcError || !order) {
        if (retryCount < 3) {
          console.log(`[usePixOrderData] Pedido não encontrado, tentando novamente em 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrderData(retryCount + 1);
        }
        throw new Error(rpcError?.message || "Pedido não encontrado ou token inválido");
      }
      
      console.log("[usePixOrderData] Pedido encontrado via RPC:", order);
      setOrderData(order as unknown as OrderDataFromRpc);
    } catch (err: unknown) {
      console.error("[usePixOrderData] Erro ao buscar pedido:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados do pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId, accessToken]);

  return { orderData, loading, error, fetchOrderData };
}
