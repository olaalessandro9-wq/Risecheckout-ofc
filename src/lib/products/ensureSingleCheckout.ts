/**
 * ensureSingleCheckout - Aguarda checkout auto-criado pelo trigger
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("EnsureCheckout");

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

  log.debug('Waiting for auto-created checkout for product:', id);

  // Aguarda checkout auto-criado pelo trigger
  for (let i = 0; i < tries; i++) {
    const { data: response, error } = await api.call<{ checkouts?: Array<{ id: string }>; error?: string }>('products-crud', {
      action: 'get-checkouts',
      productId: id,
    });
    
    if (error) {
      log.error('Edge function error:', error);
      throw error;
    }

    if (response?.error) {
      log.error('API error:', response.error);
      throw new Error(response.error);
    }
    
    const checkouts = response?.checkouts || [];
    
    if (checkouts.length > 0) {
      // ✅ AGUARDAR mais 2 iterações para garantir que o trigger terminou
      if (i < 3) {
        log.trace(`Found ${checkouts.length} checkout(s), waiting to ensure trigger completed (attempt ${i+1}/3)...`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      
      log.info(`Confirmed ${checkouts.length} checkout(s) after stabilization`);
      
      // ✅ Se houver mais de 1 checkout, algo deu errado
      if (checkouts.length > 1) {
        log.error(`ERRO: ${checkouts.length} checkouts encontrados para o produto ${id}. Esperado: 1`);
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
