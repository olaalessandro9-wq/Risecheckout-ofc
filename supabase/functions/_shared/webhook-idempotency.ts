/**
 * Webhook Idempotency - RISE V3 Compatibility Layer
 * 
 * Re-export do módulo webhook/ para manter compatibilidade com imports existentes.
 * 
 * @deprecated [2026-01-29] Prefira importar diretamente de "./_shared/webhook/index.ts"
 * @removalDate 2026-03-01 - Migrar todos os imports antes desta data
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 */

export * from "./webhook/index.ts";
