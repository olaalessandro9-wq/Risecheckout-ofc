/**
 * Webhook Events Constants
 * 
 * @module modules/webhooks/constants
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { WebhookEventType } from "../types";

/**
 * Configuração de eventos disponíveis para webhooks
 */
export interface WebhookEventConfig {
  readonly value: WebhookEventType;
  readonly label: string;
  readonly description: string;
}

/**
 * Lista de eventos disponíveis para configuração de webhooks
 */
export const WEBHOOK_EVENTS: readonly WebhookEventConfig[] = [
  {
    value: "pix_generated",
    label: "PIX Gerado",
    description: "Quando o QR Code do PIX é gerado",
  },
  {
    value: "purchase_approved",
    label: "Compra Aprovada",
    description: "Quando o pagamento é confirmado",
  },
  {
    value: "purchase_refused",
    label: "Compra Recusada",
    description: "Quando o pagamento é recusado (cartão)",
  },
  {
    value: "refund",
    label: "Reembolso",
    description: "Quando um pedido é reembolsado",
  },
  {
    value: "chargeback",
    label: "Chargeback",
    description: "Quando ocorre um chargeback",
  },
  {
    value: "checkout_abandoned",
    label: "Abandono de Checkout",
    description: "Quando o cliente abandona o checkout",
  },
] as const;

/**
 * Mapa de labels por tipo de evento
 */
export const EVENT_LABELS: Record<WebhookEventType, string> = {
  pix_generated: "PIX Gerado",
  purchase_approved: "Compra Aprovada",
  purchase_refused: "Compra Recusada",
  refund: "Reembolso",
  chargeback: "Chargeback",
  checkout_abandoned: "Abandono de Checkout",
};

/**
 * Eventos padrão ao criar um novo webhook
 */
export const DEFAULT_EVENTS: readonly WebhookEventType[] = ["purchase_approved"];
