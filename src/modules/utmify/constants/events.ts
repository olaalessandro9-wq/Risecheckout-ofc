/**
 * UTMify Events Configuration
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Constants
 */

import type { UTMifyEvent } from "../types";

export const UTMIFY_EVENTS: readonly UTMifyEvent[] = [
  { 
    id: "pix_generated", 
    label: "PIX Gerado", 
    description: "Quando o QR Code do PIX é gerado" 
  },
  { 
    id: "purchase_approved", 
    label: "Compra Aprovada", 
    description: "Quando o pagamento é confirmado" 
  },
  { 
    id: "purchase_refused", 
    label: "Compra Recusada", 
    description: "Quando o pagamento é recusado (cartão)" 
  },
  { 
    id: "refund", 
    label: "Reembolso", 
    description: "Quando um pedido é reembolsado" 
  },
  { 
    id: "chargeback", 
    label: "Chargeback", 
    description: "Quando ocorre um chargeback" 
  },
  { 
    id: "checkout_abandoned", 
    label: "Abandono de Checkout", 
    description: "Quando o cliente abandona o checkout" 
  },
] as const;
