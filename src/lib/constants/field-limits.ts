/**
 * Field Character Limits - SSOT
 * 
 * Limites de caracteres sincronizados com o backend.
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

export const PRODUCT_FIELD_LIMITS = {
  /** Nome do produto: 1-100 caracteres */
  NAME: 100,
  /** Descrição do produto: até 2000 caracteres */
  DESCRIPTION: 2000,
} as const;

export const OFFER_FIELD_LIMITS = {
  /** Nome da oferta: até 100 caracteres */
  NAME: 100,
} as const;

export const CHECKOUT_TEXT_LIMITS = {
  /** Tamanho mínimo da fonte em pixels */
  FONT_SIZE_MIN: 12,
  /** Tamanho máximo da fonte em pixels */
  FONT_SIZE_MAX: 48,
} as const;

export const TIMER_LIMITS = {
  /** Minutos: 0-59 */
  MINUTES_MIN: 0,
  MINUTES_MAX: 59,
  /** Segundos: 0-59 */
  SECONDS_MIN: 0,
  SECONDS_MAX: 59,
  /** Limite de caracteres para textos do timer */
  TEXT_MAX_LENGTH: 50,
} as const;
