import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Smart Delete: Soft delete se houver pedidos vinculados, hard delete caso contrário
 * 
 * MIGRADO: Operação via Edge Function product-management/smart-delete
 * 
 * @param _supabaseClient - Cliente Supabase (ignorado, usa cliente global)
 * @param rawProductId - ID do produto (string ou number)
 * @throws Error se o produto não puder ser excluído
 */
export async function deleteProductCascade(_supabaseClient: SupabaseClient, rawProductId: string | number): Promise<void> {
  // Garantir que productId é uma string UUID válida
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    console.error('[deleteProductCascade] Invalid product ID:', rawProductId);
    throw new Error("ID do produto inválido");
  }

  console.log('[deleteProductCascade] Starting smart deletion via Edge Function for product:', productId);

  // Chamar Edge Function para deleção segura
  const { data, error } = await supabase.functions.invoke('product-settings', {
    body: {
      action: 'smart-delete',
      productId,
    },
  });

  if (error) {
    console.error('[deleteProductCascade] Edge function error:', error);
    throw new Error(`Erro ao excluir produto: ${error.message}`);
  }

  if (data?.error) {
    console.error('[deleteProductCascade] Business logic error:', data.error);
    throw new Error(data.error);
  }

  console.log('[deleteProductCascade] ✅ Product deleted successfully via Edge Function:', data);
}
