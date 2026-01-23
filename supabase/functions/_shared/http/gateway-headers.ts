/**
 * Gateway Headers - RISE V3 Modular
 * 
 * Helper para criar headers específicos de cada gateway.
 */

import { GatewayId } from "../payment-gateways/types.ts";

/**
 * Cria headers de autenticação específicos para cada gateway
 */
export function createGatewayHeaders(
  gatewayId: GatewayId,
  apiKey: string
): Record<string, string> {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  switch (gatewayId) {
    case "mercadopago":
      return {
        ...baseHeaders,
        "Authorization": `Bearer ${apiKey}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      };
      
    case "asaas":
      return {
        ...baseHeaders,
        "access_token": apiKey,
      };
      
    case "stripe":
      return {
        ...baseHeaders,
        "Authorization": `Bearer ${apiKey}`,
      };
      
    case "pushinpay":
      return {
        ...baseHeaders,
        "Authorization": `Bearer ${apiKey}`,
      };
      
    case "pagseguro":
      return {
        ...baseHeaders,
        "Authorization": `Bearer ${apiKey}`,
      };
      
    default:
      return {
        ...baseHeaders,
        "Authorization": `Bearer ${apiKey}`,
      };
  }
}
