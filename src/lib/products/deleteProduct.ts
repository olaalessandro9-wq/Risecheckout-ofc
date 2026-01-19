/**
 * Smart Delete: Soft delete se houver pedidos vinculados, hard delete caso contrário
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 * MIGRADO: Operação via Edge Function product-management/smart-delete
 * 
 * @param _supabaseClient - Cliente Supabase (ignorado, usa cliente global)
 * @param rawProductId - ID do produto (string ou number)
 * @throws Error se o produto não puder ser excluído
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

const log = createLogger("DeleteProduct");

export async function deleteProductCascade(_supabaseClient: SupabaseClient, rawProductId: string | number): Promise<void> {
  // Garantir que productId é uma string UUID válida
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    log.error("Invalid product ID:", rawProductId);
    throw new Error("ID do produto inválido");
  }

  log.debug("Starting smart deletion via Edge Function for product:", productId);

  // Chamar Edge Function para deleção segura
  const { data, error } = await api.call<{
    success?: boolean;
    error?: string;
  }>('product-settings', {
    action: 'smart-delete',
    productId,
  });

  if (error) {
    log.error("Edge function error:", error);
    throw new Error(`Erro ao excluir produto: ${error.message}`);
  }

  if (data?.error) {
    log.error("Business logic error:", data.error);
    throw new Error(data.error);
  }

  log.info("Product deleted successfully via Edge Function:", data);
}
