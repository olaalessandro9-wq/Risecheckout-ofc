/**
 * usePixOrderData - Hook para buscar dados do pedido via RPC
 * 
 * Responsabilidade ÚNICA: Buscar e retornar dados do pedido
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";
import type { OrderDataFromRpc } from "../types";

const log = createLogger("PixOrderData");

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
      log.error("⚠️ Sem access_token");
      toast.error("Token de acesso não encontrado");
      setError("Token de acesso não encontrado");
      return;
    }

    if (!orderId) {
      log.error("⚠️ Sem orderId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      log.debug(`Buscando pedido via RPC (tentativa ${retryCount + 1}):`, orderId);
      
      const { data: order, error: rpcError } = await getOrderForPaymentRpc(orderId, accessToken);

      if (rpcError || !order) {
        if (retryCount < 3) {
          log.debug(`Pedido não encontrado, tentando novamente em 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrderData(retryCount + 1);
        }
        throw new Error(rpcError?.message || "Pedido não encontrado ou token inválido");
      }
      
      log.info("Pedido encontrado via RPC:", order);
      setOrderData(order as unknown as OrderDataFromRpc);
    } catch (err: unknown) {
      log.error("Erro ao buscar pedido:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados do pedido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId, accessToken]);

  return { orderData, loading, error, fetchOrderData };
}
