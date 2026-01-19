/**
 * @deprecated DEPRECATED since 2026-01-19
 * 
 * ⚠️ USE cors-v2.ts INSTEAD ⚠️
 * 
 * Este arquivo está DEPRECATED e será removido em versões futuras.
 * Todas as funções devem usar cors-v2.ts que implementa
 * separação de ambiente (production/development) via secrets.
 * 
 * MOTIVO DA DEPRECAÇÃO:
 * - localhost hardcoded = vulnerabilidade em produção
 * - Sem separação de ambiente
 * - Não usa secrets para origens permitidas
 * 
 * COMO MIGRAR:
 * 1. Trocar import de "../_shared/cors.ts" para "../_shared/cors-v2.ts"
 * 2. Trocar handleCors(req) para handleCorsV2(req)
 * 3. Trocar getCorsHeaders(origin) para getCorsHeadersV2(origin)
 * 
 * @version 3.0.0 - DEPRECATED (re-exports from cors-v2.ts)
 * @see cors-v2.ts
 */

// Re-export everything from cors-v2 for backwards compatibility
export { 
  handleCorsV2 as handleCors,
  getCorsHeadersV2 as getCorsHeaders,
  createCorsErrorResponseV2 as createCorsErrorResponse,
  PUBLIC_CORS_HEADERS,
} from "./cors-v2.ts";

// Legacy export for type compatibility (empty array - use cors-v2.ts for actual origins)
export const ALLOWED_ORIGINS: string[] = [];
