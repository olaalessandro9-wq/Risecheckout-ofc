/**
 * useProductCore - Gerenciamento do Produto Principal
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * 
 * Responsável por:
 * - Estado do produto (product)
 * - Carregamento inicial
 * - Atualização local
 * - Salvamento no banco via Edge Function
 * - Deleção via Edge Function
 * 
 * MIGRADO para Edge Function: product-settings (actions: update-general, smart-delete)
 */

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { ProductData } from "../../types/product.types";

const log = createLogger("ProductCore");

interface UseProductCoreOptions {
  productId: string | null;
  userId: string | undefined;
}

interface UseProductCoreReturn {
  product: ProductData | null;
  setProduct: React.Dispatch<React.SetStateAction<ProductData | null>>;
  refreshProduct: () => Promise<void>;
  updateProduct: (field: keyof ProductData, value: ProductData[keyof ProductData]) => void;
  updateProductBulk: (data: Partial<ProductData>) => void;
  saveProduct: () => Promise<void>;
  deleteProduct: () => Promise<boolean>;
}

export function useProductCore({
  productId,
  userId,
}: UseProductCoreOptions): UseProductCoreReturn {
  // Estado local apenas para product (settings vêm do React Query mapper)
  const [product, setProduct] = useState<ProductData | null>(null);

  // ---------------------------------------------------------------------------
  // REFRESH - REMOVIDO: React Query é o Single Source of Truth
  // O useProductLoader já gerencia cache e re-fetch automaticamente
  // ---------------------------------------------------------------------------

  const refreshProduct = useCallback(async (): Promise<void> => {
    // NO-OP: React Query invalidation handles this now
    log.info("refreshProduct called - delegated to React Query invalidation");
  }, []);

  // ---------------------------------------------------------------------------
  // UPDATE LOCAL - Sem salvar no banco
  // ---------------------------------------------------------------------------

  const updateProduct = useCallback(
    (field: keyof ProductData, value: ProductData[keyof ProductData]) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    },
    []
  );

  const updateProductBulk = useCallback(
    (data: Partial<ProductData>) => {
      setProduct((prev) => {
        if (!prev) return prev;
        return { ...prev, ...data };
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // SAVE - Salvar via Edge Function
  // ---------------------------------------------------------------------------

  const saveProduct = useCallback(async () => {
    if (!product || !productId || !userId) return;

    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
        action: 'update-general',
        productId,
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          support_name: product.support_name,
          support_email: product.support_email,
          status: product.status,
          delivery_url: product.external_delivery ? null : (product.delivery_url ?? null),
          external_delivery: product.external_delivery ?? false,
        },
      });

      if (error) {
        log.error("Edge Function error:", error);
        toast.error("Erro ao salvar produto");
        throw error;
      }

      if (!data?.success) {
        log.error("API error:", data?.error);
        toast.error(data?.error || "Erro ao salvar produto");
        throw new Error(data?.error || "Erro ao salvar produto");
      }

      // NOTA: Toast removido - quem chama saveProduct decide se mostra toast
      // Isso evita toasts duplicados (RISE PROTOCOL V3 - Fase 4)
      await refreshProduct();
    } catch (error: unknown) {
      log.error("Error saving product:", error);
      throw error;
    }
  }, [product, productId, userId, refreshProduct]);

  // ---------------------------------------------------------------------------
  // DELETE - Excluir via Edge Function
  // ---------------------------------------------------------------------------

  const deleteProduct = useCallback(async () => {
    if (!productId || !userId) return false;

    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string; type?: string }>('product-settings', {
        action: 'smart-delete',
        productId,
      });

      if (error) {
        log.error("Edge Function error:", error);
        // Sem toast - ConfirmDeleteDialog gerencia as mensagens
        return false;
      }

      if (!data?.success) {
        log.error("API error:", data?.error);
        // Sem toast - ConfirmDeleteDialog gerencia as mensagens
        return false;
      }

      log.info(`Product deleted successfully: ${data.type}`);
      // Sem toast - ConfirmDeleteDialog gerencia as mensagens
      return true;
    } catch (error: unknown) {
      log.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir produto");
      return false;
    }
  }, [productId, userId]);

  return {
    product,
    setProduct,
    refreshProduct,
    updateProduct,
    updateProductBulk,
    saveProduct,
    deleteProduct,
  };
}
