/**
 * Payment Core Constants
 * 
 * Constantes compartilhadas entre todos os gateways.
 */

// ============================================
// CSS CLASSES
// ============================================

export const INPUT_BASE_CLASS = `
  w-full 
  h-10 
  px-3 
  rounded-lg 
  border 
  transition-all 
  outline-none 
  bg-white 
  text-gray-900
`.trim().replace(/\s+/g, ' ');

export const INPUT_ERROR_CLASS = 'ring-2 ring-red-500 border-red-500';

export const INPUT_DISABLED_CLASS = 'opacity-50 cursor-not-allowed';

export const LABEL_CLASS = 'text-xs text-gray-500 font-medium';

export const ERROR_MESSAGE_CLASS = 'text-red-500 text-xs font-medium mt-1';

// ============================================
// VALIDATION MESSAGES
// ============================================

export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_CARD_NUMBER: 'Número do cartão inválido',
  INVALID_CVV: 'CVV inválido',
  INVALID_EXPIRATION: 'Data de expiração inválida',
  INVALID_HOLDER_NAME: 'Nome do titular inválido',
  INVALID_DOCUMENT: 'CPF/CNPJ inválido',
  INVALID_INSTALLMENTS: 'Selecione o número de parcelas',
  MIN_LENGTH: (min: number) => `Mínimo de ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Máximo de ${max} caracteres`,
} as const;

// ============================================
// GATEWAY DISPLAY NAMES
// ============================================

export const GATEWAY_DISPLAY_NAMES: Record<string, string> = {
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
  pagseguro: 'PagSeguro',
  cielo: 'Cielo',
  rede: 'Rede',
  getnet: 'Getnet',
  adyen: 'Adyen',
  paypal: 'PayPal',
};

// ============================================
// CARD BRANDS
// ============================================

export const CARD_BRANDS = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  ELO: 'elo',
  HIPERCARD: 'hipercard',
  DINERS: 'diners',
  DISCOVER: 'discover',
} as const;

// ============================================
// REGEX PATTERNS
// ============================================

export const PATTERNS = {
  CARD_NUMBER: /^\d{13,19}$/,
  CVV: /^\d{3,4}$/,
  EXPIRATION_MONTH: /^(0[1-9]|1[0-2])$/,
  EXPIRATION_YEAR: /^\d{2,4}$/,
  HOLDER_NAME: /^[a-zA-ZÀ-ÿ\s]{3,}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
} as const;
