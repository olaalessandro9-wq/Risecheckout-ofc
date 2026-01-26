/**
 * Supabase Client - REMOVED (RISE Protocol V3)
 * 
 * RISE ARCHITECT PROTOCOL V3 - Zero Database Access from Frontend (10.0/10)
 * 
 * ⛔ ESTE ARQUIVO FOI REMOVIDO ⛔
 * 
 * O frontend NÃO possui mais um Supabase client direto.
 * Todas as operações passam pelo API Gateway via api.call().
 * 
 * Migração:
 *   import { api } from "@/lib/api";
 *   const { data } = await api.call('products-crud', { action: 'list' });
 * 
 * @see docs/API_GATEWAY_ARCHITECTURE.md
 */

import type { Database } from './types';

/**
 * Stub que lança erro explicativo
 * 
 * Qualquer tentativa de usar este client resultará em erro claro
 * direcionando para a arquitetura correta.
 */
const errorHandler = {
  get(_target: unknown, prop: string): never {
    throw new Error(
      `[RISE V3] O Supabase client foi removido. ` +
      `Operação "${String(prop)}" não permitida. ` +
      `Use api.call() de @/lib/api. ` +
      `Veja docs/API_GATEWAY_ARCHITECTURE.md`
    );
  },
};

/**
 * @deprecated REMOVIDO - Use api.call() de @/lib/api
 */
export const supabase = new Proxy({} as ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>, errorHandler);

// Re-export type for files that may need it
export type { Database };
