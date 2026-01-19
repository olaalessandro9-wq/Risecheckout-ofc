/**
 * Clona o layout completo de um checkout para outro via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { cloneCheckoutLayoutRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger('CloneCheckoutDeep');

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
  log.debug('Chamando RPC clone_checkout_layout', {
    p_source_checkout_id: srcCheckoutId,
    p_target_checkout_id: dstCheckoutId,
  });

  const { error } = await cloneCheckoutLayoutRpc(srcCheckoutId, dstCheckoutId);

  if (error) {
    log.error('RPC falhou', error);
    throw error;
  }

  log.debug('RPC concluída com sucesso');
}
