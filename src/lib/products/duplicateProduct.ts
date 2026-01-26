/**
 * duplicateProductDeep - Duplica produto completo via Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - API Gateway Architecture (10.0/10)
 * 
 * A duplicação é feita atomicamente no backend, garantindo:
 * - Transação única (tudo ou nada)
 * - Segurança via validação de ownership
 * - Rate limiting
 * - Logs centralizados
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("DuplicateProduct");

export async function duplicateProductDeep(
  rawProductId: string | number
): Promise<{ newProductId: string }> {
  const productId = String(rawProductId).trim();
  
  if (!productId || productId === 'undefined' || productId === 'null') {
    log.error('Invalid product ID:', rawProductId);
    throw new Error("ID do produto inválido");
  }

  log.debug('Starting duplication via Edge Function for product:', productId);

  const { data, error } = await api.call<{
    success?: boolean;
    error?: string;
    newProductId?: string;
  }>('product-duplicate', { productId });

  if (error) {
    log.error('Edge Function error:', error);
    throw new Error(error.message || 'Falha ao duplicar produto');
  }

  if (!data?.success) {
    log.error('Duplication failed:', data?.error);
    throw new Error(data?.error || 'Falha ao duplicar produto');
  }

  if (!data?.newProductId) {
    throw new Error('Resposta inválida: newProductId não encontrado');
  }

  log.info('Duplication completed successfully, new product:', data.newProductId);
  
  return { newProductId: data.newProductId };
}
