/**
 * Barrel Export - UTMify Module
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 4.0.0 - RISE Protocol V3 - Backend SSOT
 * 
 * IMPORTANTE: O tracking UTMify é agora feito EXCLUSIVAMENTE no backend
 * via _shared/utmify-dispatcher.ts nos webhooks de pagamento.
 * 
 * Este módulo exporta apenas:
 * - Tipos (para tipagem de dados)
 * - Utils (extractUTMParameters, formatDateForUTMify - usados pelo createOrderActor)
 * - Hooks (useUTMifyConfig, shouldRunUTMify - usados pelo painel admin)
 * - Tracker (componente de logging/debug)
 * 
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md - UTMify Backend SSOT
 */

// Tipos
export * from "./types";

// Utils (usados pelo createOrderActor para persistir UTMs no pedido)
export * from "./utils";

// Events (re-exports de utils para compatibilidade)
export * from "./events";

// Hooks (usados pelo painel admin para configuração)
export * from "./hooks";

// Componente (pixel CDN + InitiateCheckout)
export { Pixel } from "./Pixel";
