/**
 * Duplica um checkout usando a RPC duplicate_checkout_shallow via RPC Proxy
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { duplicateCheckoutShallowRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger("DuplicateCheckout");

/**
 * Duplica um checkout de um produto usando a RPC duplicate_checkout_shallow.
 * - Cria checkout com layout clonado
 * - Retorna o ID do novo checkout e a URL de edição
 */
export async function duplicateCheckout(checkoutId: string) {
  // Sanitiza caso venha "checkout-<id>" de algum lugar
  const srcId = checkoutId.replace(/^checkout-/, "");

  log.debug('Calling RPC duplicate_checkout_shallow via proxy:', { p_source_checkout_id: srcId });

  const { data: newId, error } = await duplicateCheckoutShallowRpc(srcId);

  if (error) {
    log.error('RPC failed:', error);
    throw error;
  }

  if (!newId) {
    throw new Error("RPC não retornou o ID do novo checkout");
  }

  log.info('RPC succeeded, new checkout ID:', newId);

  const editUrl = `/dashboard/produtos/checkout/personalizar?id=${newId}`;
  return { id: newId, editUrl };
}
