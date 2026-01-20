/**
 * useProductDelete - Operação de Deleção de Produto
 * 
 * Single Responsibility: Apenas deleção via Edge Function
 * 
 * @version 4.0.0 - RISE Protocol V3 - XState Migration
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility Principle
 */

import { useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("ProductDelete");

interface UseProductDeleteOptions {
  productId: string | null;
  userId: string | undefined;
}

interface UseProductDeleteReturn {
  deleteProduct: () => Promise<boolean>;
}

export function useProductDelete({
  productId,
  userId,
}: UseProductDeleteOptions): UseProductDeleteReturn {

  const deleteProduct = useCallback(async (): Promise<boolean> => {
    if (!productId || !userId) return false;

    try {
      const { data, error } = await api.call<{ 
        success?: boolean; 
        error?: string; 
        type?: string;
      }>('product-settings', {
        action: 'smart-delete',
        productId,
      });

      if (error) {
        log.error("Edge Function error:", error);
        return false;
      }

      if (!data?.success) {
        log.error("API error:", data?.error);
        return false;
      }

      log.info(`Product deleted successfully: ${data.type}`);
      return true;
    } catch (error: unknown) {
      log.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir produto");
      return false;
    }
  }, [productId, userId]);

  return {
    deleteProduct,
  };
}
