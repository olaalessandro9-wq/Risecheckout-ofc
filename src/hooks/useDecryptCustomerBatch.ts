/**
 * useDecryptCustomerBatch
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface DecryptedBatchData {
  customer_phone?: string | null;
  customer_document?: string | null;
}

interface DecryptBatchResponse {
  success: boolean;
  data?: Record<string, DecryptedBatchData>;
  denied?: string[];
  error?: string;
}

interface UseDecryptCustomerBatchReturn {
  decryptedMap: Record<string, DecryptedBatchData>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para descriptografar telefones em lote para a listagem
 * APENAS para produtores (user.id === product.user_id)
 */
export function useDecryptCustomerBatch(
  orderIds: string[],
  enabled: boolean = true
): UseDecryptCustomerBatchReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ["decrypt-customer-batch", orderIds.sort().join(",")],
    queryFn: async () => {
      if (orderIds.length === 0) {
        return { data: {}, denied: [] };
      }

      const { data: result, error: apiError } = await api.call<DecryptBatchResponse>(
        "decrypt-customer-data-batch",
        { order_ids: orderIds, fields: ["customer_phone"] }
      );

      if (apiError) {
        throw new Error(apiError.message || "Erro ao descriptografar dados");
      }

      if (!result?.success) {
        throw new Error(result?.error || "Falha na descriptografia");
      }

      return result;
    },
    enabled: enabled && orderIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  return {
    decryptedMap: data?.data || {},
    isLoading,
    error: error ? (error as Error).message : null,
  };
}
