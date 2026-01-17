/**
 * duplicateProductDeep - Duplica produto completo via Edge Function
 * 
 * A duplicação é feita atomicamente no backend, garantindo:
 * - Transação única (tudo ou nada)
 * - Segurança via validação de ownership
 * - Rate limiting
 * - Logs centralizados
 */

import { api } from "@/lib/api";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function duplicateProductDeep(
  _supabaseClient: SupabaseClient,  // Mantido para compatibilidade, mas não usado
  rawProductId: string | number
): Promise<{ newProductId: string }> {
  // Garantir que productId é uma string UUID válida
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    console.error('[duplicateProductDeep] Invalid product ID:', rawProductId);
    throw new Error("ID do produto inválido");
  }

  console.log('[duplicateProductDeep] Starting duplication via Edge Function for product:', productId);

  const { data, error } = await api.call<{
    success?: boolean;
    error?: string;
    newProductId?: string;
  }>('product-duplicate', { productId });

  if (error) {
    console.error('[duplicateProductDeep] Edge Function error:', error);
    throw new Error(error.message || 'Falha ao duplicar produto');
  }

  if (!data?.success) {
    console.error('[duplicateProductDeep] Duplication failed:', data?.error);
    throw new Error(data?.error || 'Falha ao duplicar produto');
  }

  if (!data?.newProductId) {
    throw new Error('Resposta inválida: newProductId não encontrado');
  }

  console.log('[duplicateProductDeep] Duplication completed successfully, new product:', data.newProductId);
  
  return { newProductId: data.newProductId };
}
