/**
 * Tipos Compartilhados para Checkout
 * Módulo: src/types/checkout-shared.types.ts
 * 
 * Tipos centralizados para dados de checkout, formulários e cupons.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 Compliance
 */

// ============================================================================
// PRODUCT DATA
// ============================================================================

/**
 * Dados do produto para exibição no checkout
 */
export interface CheckoutProductData {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
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
 * Compatível com CheckoutFormErrors de checkout.ts
 */
export type SharedCheckoutFormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  [field: string]: string | undefined;
};

/**
 * Configuração de campos obrigatórios - SINGLE SOURCE OF TRUTH
 * 
 * IMPORTANTE: Esta é a definição canônica. Todos os arquivos devem importar daqui.
 * 
 * name e email são SEMPRE obrigatórios (true fixo).
 * phone e cpf são configuráveis pelo vendedor.
 */
export interface RequiredFieldsConfig {
  name: boolean;   // Sempre true
  email: boolean;  // Sempre true  
  phone: boolean;  // Configurável pelo vendedor
  cpf: boolean;    // Configurável pelo vendedor
}

/**
 * Normaliza required_fields de qualquer formato para RequiredFieldsConfig.
 * Suporta array ['cpf', 'phone'] ou objeto { cpf: true }.
 */
export function normalizeRequiredFields(
  input: unknown
): RequiredFieldsConfig {
  const defaults: RequiredFieldsConfig = {
    name: true,
    email: true,
    phone: false,
    cpf: false,
  };

  if (!input) return defaults;

  if (Array.isArray(input)) {
    return {
      ...defaults,
      phone: input.includes('phone'),
      cpf: input.includes('cpf'),
    };
  }

  if (typeof input === 'object') {
    const obj = input as Record<string, boolean>;
    return {
      ...defaults,
      phone: obj.phone === true,
      cpf: obj.cpf === true,
    };
  }

  return defaults;
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
  discount_type: 'percentage';
  discount_value: number;
  apply_to_order_bumps?: boolean;
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
