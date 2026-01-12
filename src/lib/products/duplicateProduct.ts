/**
 * duplicateProductDeep - Duplica produto completo via Edge Function
 * 
 * A duplicação é feita atomicamente no backend, garantindo:
 * - Transação única (tudo ou nada)
 * - Segurança via validação de ownership
 * - Rate limiting
 * - Logs centralizados
 */

import { supabase } from "@/integrations/supabase/client";

export async function duplicateProductDeep(
  _supabaseClient: any,  // Mantido para compatibilidade, mas não usado
  rawProductId: string | number
): Promise<{ newProductId: string }> {
  // Garantir que productId é uma string UUID válida
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    console.error('[duplicateProductDeep] Invalid product ID:', rawProductId);
    throw new Error("ID do produto inválido");
  }

  console.log('[duplicateProductDeep] Starting duplication via Edge Function for product:', productId);

  const sessionToken = localStorage.getItem('producer_session_token');
  
  if (!sessionToken) {
    throw new Error("Sessão não encontrada. Faça login novamente.");
  }

  const { data, error } = await supabase.functions.invoke('product-duplicate', {
    body: { productId },
    headers: { 'x-producer-session-token': sessionToken }
  });

  if (error) {
    console.error('[duplicateProductDeep] Edge Function error:', error);
    throw new Error(error.message || 'Falha ao duplicar produto');
  }

  if (!data?.success) {
    console.error('[duplicateProductDeep] Duplication failed:', data?.error);
    throw new Error(data?.error || 'Falha ao duplicar produto');
  }

  console.log('[duplicateProductDeep] Duplication completed successfully, new product:', data.data.newProductId);
  
  return { newProductId: data.data.newProductId };
}
