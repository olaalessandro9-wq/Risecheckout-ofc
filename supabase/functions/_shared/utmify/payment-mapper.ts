/**
 * ============================================================================
 * UTMify Payment Method Mapper
 * ============================================================================
 * 
 * @module _shared/utmify/payment-mapper
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Mapeamento de métodos de pagamento para o formato UTMify.
 * ============================================================================
 */

/**
 * Mapeia método de pagamento para formato UTMify
 * 
 * @param method - Método de pagamento (pode conter variações)
 * @returns Método normalizado para UTMify (pix, credit_card, boleto)
 */
export function mapPaymentMethod(method: string): string {
  const normalized = method.toLowerCase();
  
  if (normalized.includes("pix")) return "pix";
  if (normalized.includes("credit") || normalized.includes("card") || normalized.includes("cartao")) {
    return "credit_card";
  }
  if (normalized.includes("boleto")) return "boleto";
  
  return normalized;
}
