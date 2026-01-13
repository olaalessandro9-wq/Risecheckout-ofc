import { supabase } from "@/integrations/supabase/client";

/**
 * Duplica um checkout de um produto usando a RPC duplicate_checkout_shallow.
 * - Cria checkout com layout clonado
 * - Retorna o ID do novo checkout e a URL de edição
 */
export async function duplicateCheckout(checkoutId: string) {
  // Sanitiza caso venha "checkout-<id>" de algum lugar
  const srcId = checkoutId.replace(/^checkout-/, "");

  console.log('[duplicateCheckout] Calling RPC duplicate_checkout_shallow:', {
    p_source_checkout_id: srcId,
  });

  // Chama a RPC que cria o checkout e retorna o ID
  const { data: newId, error } = await supabase.rpc("duplicate_checkout_shallow", {
    p_source_checkout_id: srcId,
  }) as { data: string | null; error: Error | null };

  if (error) {
    console.error('[duplicateCheckout] RPC failed:', error);
    throw error;
  }

  if (!newId) {
    throw new Error("RPC não retornou o ID do novo checkout");
  }

  console.log('[duplicateCheckout] RPC succeeded, new checkout ID:', newId);

  const editUrl = `/dashboard/produtos/checkout/personalizar?id=${newId}`;
  return { id: newId, editUrl };
}
