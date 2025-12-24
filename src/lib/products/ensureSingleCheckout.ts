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

  // ✅ REMOVIDA a checagem inicial imediata (linhas 17-26)
  // Isso previne race conditions com o trigger
  
  // Aguarda checkout auto-criado pelo trigger
  for (let i = 0; i < tries; i++) {
    const { data, error } = await supabase
      .from("checkouts")
      .select("id")
      .eq("product_id", id)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error('[ensureSingleCheckout] Query error:', error);
      throw error;
    }
    
    if (data?.length) {
      // ✅ AGUARDAR mais 2 iterações para garantir que o trigger terminou
      if (i < 3) {
        console.log(`[ensureSingleCheckout] Found ${data.length} checkout(s), waiting to ensure trigger completed (attempt ${i+1}/3)...`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      
      console.log(`[ensureSingleCheckout] Confirmed ${data.length} checkout(s) after stabilization`);
      
      // ✅ Se houver mais de 1 checkout, algo deu errado
      if (data.length > 1) {
        console.error(`[ensureSingleCheckout] ERRO: ${data.length} checkouts encontrados para o produto ${id}. Esperado: 1`);
      }
      
      return data[0];
    }
    
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(
    `Timeout: Nenhum checkout foi criado automaticamente para o produto ${id}. ` +
    `Verifique o trigger create_default_checkout no banco.`
  );
}
