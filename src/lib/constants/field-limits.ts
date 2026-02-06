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

export const PRODUCT_DUPLICATION = {
  /** Sufixo padrão para cópia */
  COPY_SUFFIX: " (Cópia)",
  /** Tamanho do sufixo padrão */
  COPY_SUFFIX_LENGTH: 8,
  /** Limite máximo do nome do produto */
  MAX_NAME_LENGTH: 100,
  /** Tamanho máximo para nome base (garante espaço para sufixo + contador) */
  MAX_BASE_NAME_LENGTH: 88,
} as const;

export const FIXED_HEADER_LIMITS = {
  /** Título da header: até 60 caracteres (balanceado para responsividade) */
  TITLE_MAX: 60,
  /** Ponto de truncamento visual na área do aluno */
  TITLE_TRUNCATE_DISPLAY: 45,
  /** Descrição customizada: até 300 caracteres */
  DESCRIPTION_MAX: 300,
  /** Texto do botão CTA: até 30 caracteres */
  CTA_BUTTON_TEXT_MAX: 30,
} as const;

export const ORDER_BUMP_FIELD_LIMITS = {
  /** Título customizado do order bump: até 100 caracteres */
  CUSTOM_TITLE: 100,
  /** Descrição customizada do order bump: até 300 caracteres */
  CUSTOM_DESCRIPTION: 300,
} as const;
