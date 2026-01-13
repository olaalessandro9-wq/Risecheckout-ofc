/**
 * Tipos Compartilhados para Checkout
 * Módulo: src/types/checkout-shared.types.ts
 * 
 * Tipos centralizados para dados de checkout, formulários e cupons.
 * RISE ARCHITECT PROTOCOL V2 - Zero Technical Debt
 */

// ============================================================================
// PRODUCT DATA
// ============================================================================

/**
 * Dados do produto para exibição no checkout
 */
export interface CheckoutProductData {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  required_fields?: RequiredFieldsConfig;
  vendor_id?: string;
}

// ============================================================================
// FORM DATA
// ============================================================================

/**
 * Dados do formulário de checkout
 */
export interface CheckoutFormData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  [key: string]: string | undefined;
}

/**
 * Erros de validação do formulário
 */
export interface CheckoutFormErrors {
  [field: string]: string | undefined;
}

/**
 * Configuração de campos obrigatórios
 */
export interface RequiredFieldsConfig {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  cpf?: boolean;
  address?: boolean;
}

// ============================================================================
// COUPON DATA
// ============================================================================

/**
 * Cupom aplicado no checkout
 */
export interface AppliedCoupon {
  id: string;
  code: string;
  name?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  apply_to_order_bumps?: boolean;
}

// ============================================================================
// DESIGN INPUT
// ============================================================================

/**
 * Input para normalização de design
 * Aceita dados parciais vindos do banco de dados
 */
export interface CheckoutDesignInput {
  theme?: 'light' | 'dark' | string;
  design?: unknown;
  background_color?: string;
  text_color?: string;
  primary_color?: string;
  button_color?: string;
  button_text_color?: string;
  primary_text_color?: string;
  secondary_text_color?: string;
  box_bg_color?: string;
  box_primary_text_color?: string;
  box_secondary_text_color?: string;
  form_background_color?: string;
  icon_color?: string;
  selected_payment_color?: string;
  payment_button_bg_color?: string;
  payment_button_text_color?: string;
  cc_field_background_color?: string;
  cc_field_text_color?: string;
  cc_field_placeholder_color?: string;
  cc_field_border_color?: string;
  cc_field_focus_border_color?: string;
  cc_field_focus_text_color?: string;
  font?: string;
  [key: string]: unknown;
}

// ============================================================================
// HANDLER VALUE TYPES
// ============================================================================

/**
 * Valores possíveis para handlers de formulário genéricos
 */
export type FormFieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Valores para configurações de checkout
 */
export type CheckoutSettingValue = string | number | boolean | Record<string, unknown>;
