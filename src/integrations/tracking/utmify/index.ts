/**
 * Barrel Export - UTMify Module
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Backend SSOT: Eventos transacionais (purchase_approved, pix_generated, refund, chargeback)
 *   disparados via _shared/utmify/dispatcher.ts nos webhooks de pagamento.
 * - Frontend Pixel: Eventos comportamentais (InitiateCheckout) disparados pelo
 *   script CDN do UTMify via componente Pixel.tsx.
 * 
 * Este módulo exporta:
 * - Tipos (para tipagem de dados)
 * - Utils (extractUTMParameters, formatDateForUTMify - usados pelo createOrderActor)
 * - Hooks (useUTMifyConfig, shouldRunUTMify - usados pelo painel admin)
 * - Pixel (componente que injeta CDN script e dispara InitiateCheckout)
 * 
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 * @see docs/TRACKING_MODULE.md
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
