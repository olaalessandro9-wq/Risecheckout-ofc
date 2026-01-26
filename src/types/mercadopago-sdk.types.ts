/**
 * Tipos para SDK do MercadoPago
 * Módulo: src/types/mercadopago-sdk.types.ts
 * 
 * Tipos para callbacks e respostas do SDK de pagamento.
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

// ============================================================================
// INSTALLMENTS
// ============================================================================

/**
 * Opção de parcelamento do MercadoPago
 */
export interface MercadoPagoInstallment {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  reimbursement_rate: number | null;
  labels: string[];
  installment_rate_collector: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  recommended_message: string;
  installment_amount: number;
  total_amount: number;
  payment_method_option_id: string;
}

/**
 * Resposta de parcelamento do MercadoPago
 */
export interface MercadoPagoInstallmentsResponse {
  payer_costs: MercadoPagoInstallment[];
  payment_method_id: string;
  payment_type_id: string;
  issuer: MercadoPagoIssuer;
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Método de pagamento do MercadoPago
 */
export interface MercadoPagoPaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  status: string;
  secure_thumbnail: string;
  thumbnail: string;
  deferred_capture: string;
  settings: MercadoPagoPaymentMethodSetting[];
  additional_info_needed: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  accreditation_time: number;
  financial_institutions: MercadoPagoFinancialInstitution[];
  processing_modes: string[];
}

/**
 * Configuração de método de pagamento
 */
export interface MercadoPagoPaymentMethodSetting {
  card_number: {
    validation: string;
    length: number;
  };
  bin: {
    pattern: string;
    installments_pattern: string;
    exclusion_pattern: string | null;
  };
  security_code: {
    length: number;
    card_location: string;
    mode: string;
  };
}

/**
 * Instituição financeira
 */
export interface MercadoPagoFinancialInstitution {
  id: string;
  description: string;
}

/**
 * Emissor de cartão
 */
export interface MercadoPagoIssuer {
  id: string;
  name: string;
  secure_thumbnail: string;
  thumbnail: string;
}

// ============================================================================
// CALLBACKS
// ============================================================================

/**
 * Erro de callback do MercadoPago
 */
export type MercadoPagoCallbackError = {
  message?: string;
  cause?: Array<{ code: string; description: string }>;
  fieldErrors?: Array<{ field: string; message: string }>;
} | null;

/**
 * Callback quando formulário é montado
 */
export type OnFormMountedCallback = (error: MercadoPagoCallbackError) => void;

/**
 * Callback quando métodos de pagamento são recebidos
 */
export type OnPaymentMethodsReceivedCallback = (
  error: MercadoPagoCallbackError,
  methods: MercadoPagoPaymentMethod[]
) => void;

/**
 * Callback quando parcelamentos são recebidos
 */
export type OnInstallmentsReceivedCallback = (
  error: MercadoPagoCallbackError,
  data: MercadoPagoInstallmentsResponse[]
) => void;

/**
 * Callback de submit do formulário
 */
export type OnSubmitCallback = (
  error: MercadoPagoCallbackError,
  token: string | null
) => void;

// ============================================================================
// CARD FORM
// ============================================================================

/**
 * Dados do formulário de cartão
 */
export interface MercadoPagoCardFormData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
  installments: number;
  issuer: string;
}

/**
 * Token de cartão gerado
 */
export interface MercadoPagoCardToken {
  id: string;
  public_key: string;
  first_six_digits: string;
  last_four_digits: string;
  expiration_month: number;
  expiration_year: number;
  cardholder: {
    name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  date_created: string;
  date_last_updated: string;
  status: string;
  luhn_validation: boolean;
  live_mode: boolean;
}

// ============================================================================
// BRICK TYPES
// ============================================================================

/**
 * Configuração do Brick de pagamento
 */
export interface MercadoPagoBrickConfig {
  amount: number;
  payer?: {
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

/**
 * Callbacks do Brick
 */
export interface MercadoPagoBrickCallbacks {
  onReady?: () => void;
  onError?: (error: MercadoPagoCallbackError) => void;
  onSubmit?: (formData: MercadoPagoCardFormData) => Promise<void>;
}
