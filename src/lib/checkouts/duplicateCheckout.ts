/**
 * Duplica um checkout usando a RPC duplicate_checkout_shallow via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { duplicateCheckoutShallowRpc } from "@/lib/rpc/rpcProxy";

/**
 * Duplica um checkout de um produto usando a RPC duplicate_checkout_shallow.
 * - Cria checkout com layout clonado
 * - Retorna o ID do novo checkout e a URL de edição
 */
export async function duplicateCheckout(checkoutId: string) {
  // Sanitiza caso venha "checkout-<id>" de algum lugar
  const srcId = checkoutId.replace(/^checkout-/, "");

  console.log('[duplicateCheckout] Calling RPC duplicate_checkout_shallow via proxy:', {
    p_source_checkout_id: srcId,
  });

  const { data: newId, error } = await duplicateCheckoutShallowRpc(srcId);

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
