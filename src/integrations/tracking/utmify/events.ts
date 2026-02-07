/**
 * UTMify Events - Re-exports de Utils
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Eventos transacionais no backend (SSOT) via _shared/utmify/dispatcher.ts
 * - Eventos comportamentais (InitiateCheckout) no frontend via Pixel CDN
 * 
 * Este arquivo mantém apenas os re-exports de utils para compatibilidade
 * com código existente que importa daqui.
 * 
 * @see docs/EDGE_FUNCTIONS_REGISTRY.md
 * @see supabase/functions/_shared/utmify/dispatcher.ts
 */

// Re-export utils para compatibilidade (usado pelo createOrderActor)
export { 
  extractUTMParameters, 
  formatDateForUTMify, 
  convertToCents, 
  convertToReais 
} from "./utils";

// NOTA: As funções abaixo foram REMOVIDAS (RISE V3 - Backend SSOT):
// - sendUTMifyConversion (agora é backend-only via utmify-dispatcher.ts)
// - trackPageView (nunca foi implementado corretamente)
// - trackAddToCart (nunca foi implementado corretamente)
// - trackPurchase (redundante com backend)
// - trackRefund (redundante com backend)
//
// Eventos UTMify são disparados exclusivamente pelo backend:
// - pix_generated: via gateway create-payment handlers
// - purchase_approved: via webhook-post-payment.ts
// - purchase_refused: via stripe-webhook/mercadopago-webhook
// - refund: via webhook-post-refund.ts
// - chargeback: via webhook-post-refund.ts
