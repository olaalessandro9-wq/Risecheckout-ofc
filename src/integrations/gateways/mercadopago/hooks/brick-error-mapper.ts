/**
 * Mapeamento de Erros do Brick - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/hooks/brick-error-mapper.ts
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mapeia erros do SDK do Mercado Pago para mensagens amigáveis.
 */

export interface FieldErrors {
  cardNumber?: string;
  expirationDate?: string;
  securityCode?: string;
  cardholderName?: string;
  identificationNumber?: string;
  installments?: string;
}

interface ErrorItem {
  code?: string;
  message?: string;
  description?: string;
}

/**
 * Mapeia erros do SDK do Mercado Pago para FieldErrors
 * 
 * @param error - Erro retornado pelo SDK
 * @returns Objeto com erros mapeados por campo
 */
export function mapTokenErrors(error: unknown): FieldErrors {
  const errorObj = error as { cause?: unknown };
  const rawList = Array.isArray(error) ? error : (errorObj.cause || [error]);
  const errorList = Array.isArray(rawList) ? rawList : [rawList];
  
  const mappedErrors: FieldErrors = {};
  
  errorList.forEach((e: unknown) => {
    const errItem = e as ErrorItem;
    const code = String(errItem.code || '');
    const msg = String(errItem.message || '').toLowerCase();
    const desc = String(errItem.description || '').toLowerCase();
    
    // CARTÃO
    if (
      ['205', 'E301', '3034'].includes(code) || 
      msg.includes('card number') || msg.includes('card_number') ||
      desc.includes('card number') || desc.includes('card_number')
    ) {
      mappedErrors.cardNumber = "Número inválido";
    }
    // VALIDADE
    else if (
      ['208', '209', '325', '326'].includes(code) || 
      msg.includes('expiration') || msg.includes('date') ||
      desc.includes('expiration') || desc.includes('date')
    ) {
      mappedErrors.expirationDate = "Data inválida";
    }
    // CVV
    else if (
      ['220', '221', '224', '225', '226', 'E302'].includes(code) || 
      msg.includes('security') || msg.includes('cvv') || msg.includes('security_code') ||
      desc.includes('security') || desc.includes('cvv') || desc.includes('security_code')
    ) {
      mappedErrors.securityCode = "CVV inválido";
    }
    // FALLBACK -> CARTÃO
    else {
      mappedErrors.cardNumber = "Número inválido";
    }
  });

  return mappedErrors;
}

/**
 * Retorna erros fallback quando o SDK falha sem lista de erros
 * 
 * @returns FieldErrors com todos os campos obrigatórios marcados
 */
export function getFallbackErrors(): FieldErrors {
  return {
    cardNumber: "Obrigatório",
    expirationDate: "Obrigatório",
    securityCode: "Obrigatório"
  };
}
