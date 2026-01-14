/**
 * Clona o layout completo de um checkout para outro via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { cloneCheckoutLayoutRpc } from "@/lib/rpc/rpcProxy";

/**
 * Clona o layout completo de um checkout para outro usando a RPC clone_checkout_layout.
 * 
 * @param srcCheckoutId - ID do checkout origem
 * @param dstCheckoutId - ID do checkout destino (já deve estar criado)
 * @throws Error se a RPC falhar
 */
export async function cloneCheckoutDeep(
  srcCheckoutId: string,
  dstCheckoutId: string
): Promise<void> {
  console.log('[cloneCheckoutDeep] Calling RPC clone_checkout_layout via proxy:', {
    p_source_checkout_id: srcCheckoutId,
    p_target_checkout_id: dstCheckoutId,
  });

  const { error } = await cloneCheckoutLayoutRpc(srcCheckoutId, dstCheckoutId);

  if (error) {
    console.error("[cloneCheckoutDeep] RPC failed:", error);
    throw error;
  }

  console.log('[cloneCheckoutDeep] RPC succeeded');
}
