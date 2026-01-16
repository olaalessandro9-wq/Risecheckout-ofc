/**
 * ensureSingleCheckout - Aguarda checkout auto-criado pelo trigger
 * 
 * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Aguarda checkout auto-criado (se houver automação/trigger), e só cria 1 checkout
 * caso não apareça nenhum após o timeout. Idempotente.
 */
export async function ensureSingleCheckout(
  productId: string | number,
  opts?: { tries?: number; delayMs?: number }
) {
  const id = String(productId);
  const tries = opts?.tries ?? 50;
  const delayMs = opts?.delayMs ?? 300;

  console.log('[ensureSingleCheckout] Waiting for auto-created checkout for product:', id);

  const sessionToken = localStorage.getItem('producer_session_token');

  // Aguarda checkout auto-criado pelo trigger
  for (let i = 0; i < tries; i++) {
    const { data: response, error } = await supabase.functions.invoke('products-crud', {
      body: {
        action: 'get-checkouts',
        productId: id,
      },
      headers: {
        'x-producer-session-token': sessionToken || '',
      },
    });
    
    if (error) {
      console.error('[ensureSingleCheckout] Edge function error:', error);
      throw error;
    }

    if (response?.error) {
      console.error('[ensureSingleCheckout] API error:', response.error);
      throw new Error(response.error);
    }
    
    const checkouts = response?.checkouts || [];
    
    if (checkouts.length > 0) {
      // ✅ AGUARDAR mais 2 iterações para garantir que o trigger terminou
      if (i < 3) {
        console.log(`[ensureSingleCheckout] Found ${checkouts.length} checkout(s), waiting to ensure trigger completed (attempt ${i+1}/3)...`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      
      console.log(`[ensureSingleCheckout] Confirmed ${checkouts.length} checkout(s) after stabilization`);
      
      // ✅ Se houver mais de 1 checkout, algo deu errado
      if (checkouts.length > 1) {
        console.error(`[ensureSingleCheckout] ERRO: ${checkouts.length} checkouts encontrados para o produto ${id}. Esperado: 1`);
      }
      
      return checkouts[0];
    }
    
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(
    `Timeout: Nenhum checkout foi criado automaticamente para o produto ${id}. ` +
    `Verifique o trigger create_default_checkout no banco.`
  );
}
