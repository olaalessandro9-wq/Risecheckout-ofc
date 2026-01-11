/**
 * Gateway Constants
 * 
 * Definições centralizadas de gateways para o sistema de afiliação.
 * Single Source of Truth para evitar duplicação.
 */

export const GATEWAY_INFO: Record<string, { name: string }> = {
  asaas: { name: "Asaas" },
  mercadopago: { name: "Mercado Pago" },
  pushinpay: { name: "PushinPay" },
  stripe: { name: "Stripe" },
};

// TODOS os gateways disponíveis no sistema
export const ALL_PIX_GATEWAYS = ["asaas", "mercadopago", "pushinpay"] as const;
export const ALL_CARD_GATEWAYS = ["mercadopago", "stripe"] as const;

// Fallback padrão quando produtor não configurou
export const DEFAULT_PIX_GATEWAYS = ["asaas", "mercadopago", "pushinpay"];
export const DEFAULT_CARD_GATEWAYS = ["mercadopago", "stripe"];

export type PixGateway = typeof ALL_PIX_GATEWAYS[number];
export type CardGateway = typeof ALL_CARD_GATEWAYS[number];
