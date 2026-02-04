/**
 * ============================================================================
 * UTMify Constants
 * ============================================================================
 * 
 * @module _shared/utmify/constants
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Constantes centralizadas para integração UTMify.
 * ============================================================================
 */

import type { UTMifyEventType } from "./types.ts";

/**
 * URL da API UTMify
 */
export const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

/**
 * Nome da plataforma registrada
 */
export const PLATFORM_NAME = "RiseCheckout";

/**
 * Mapeamento de eventos para status da API UTMify
 */
export const STATUS_MAP: Record<UTMifyEventType, string> = {
  pix_generated: "waiting_payment",
  purchase_approved: "paid",
  purchase_refused: "refused",
  refund: "refunded",
  chargeback: "chargedback",
};
