/**
 * useMercadoPagoOrderData - Hook para buscar dados do pedido
 * 
 * Single Responsibility: Apenas busca de dados do pedido via RPC.
 * RISE Protocol V2 Compliant (~60 linhas).
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getOrderForPaymentRpc } from "@/lib/rpc/rpcProxy";
import type { MercadoPagoOrderData } from "../types";

interface UseMercadoPagoOrderDataProps {
  orderId: string | undefined;
  accessToken: string | undefined;
}

interface UseMercadoPagoOrderDataReturn {
  orderData: MercadoPagoOrderData | null;
  loading: boolean;
  error: string | null;
  fetchOrderData: () => Promise<void>;
}

export function useMercadoPagoOrderData({
  orderId,
  accessToken
}: UseMercadoPagoOrderDataProps): UseMercadoPagoOrderDataReturn {
  const [orderData, setOrderData] = useState<MercadoPagoOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderData = useCallback(async (retryCount = 0) => {
    if (!accessToken) {
      console.error("[useMercadoPagoOrderData] ⚠️ Sem access_token");
      setError("Token de acesso não encontrado");
      setLoading(false);
      toast.error("Token de acesso não encontrado");
      return;
    }

    if (!orderId) {
      setError("ID do pedido não fornecido");
      setLoading(false);
      return;
    }

    try {
      console.log(`[useMercadoPagoOrderData] Buscando pedido (tentativa ${retryCount + 1}):`, orderId);
      
      const { data: order, error: rpcError } = await getOrderForPaymentRpc(orderId, accessToken);

      if (rpcError || !order) {
        if (retryCount < 3) {
          console.log(`[useMercadoPagoOrderData] Retentando em 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrderData(retryCount + 1);
        }
        throw new Error(rpcError?.message || "Pedido não encontrado ou token inválido");
      }
      
      console.log("[useMercadoPagoOrderData] ✅ Pedido encontrado:", order);
      setOrderData(order as unknown as MercadoPagoOrderData);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar dados do pedido";
      console.error("[useMercadoPagoOrderData] ❌ Erro:", errorMessage);
      setError(errorMessage);
      toast.error("Erro ao carregar dados do pedido");
    } finally {
      setLoading(false);
    }
  }, [orderId, accessToken]);

  return {
    orderData,
    loading,
    error,
    fetchOrderData
  };
}
