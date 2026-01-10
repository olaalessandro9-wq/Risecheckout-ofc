/**
 * useMercadoPagoAvailable - Hook para verificar disponibilidade do Mercado Pago
 * 
 * Responsabilidade única: Validar se integração está ativa e configurada
 * Limite: < 30 linhas
 */

import { MercadoPagoIntegration } from "../types";

/**
 * Hook para verificar se o Mercado Pago está disponível
 * 
 * @param integration - Integração do Mercado Pago
 * @returns true se disponível e ativo
 * 
 * @example
 * const isAvailable = useMercadoPagoAvailable(integration);
 * 
 * if (isAvailable) {
 *   // Mostrar opção de pagamento
 * }
 */
export function useMercadoPagoAvailable(
  integration: MercadoPagoIntegration | null | undefined
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // Validação: public key configurada
  if (!integration.config?.public_key) {
    return false;
  }

  return true;
}
