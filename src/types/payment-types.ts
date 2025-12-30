/**
 * Payment Types - Fonte Única de Verdade
 * 
 * Este arquivo centraliza TODOS os tipos relacionados a pagamentos.
 * Tanto o frontend quanto o backend devem usar estes tipos.
 */

// ============================================
// PAYMENT METHOD & GATEWAY TYPES
// ============================================

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';

export type PaymentGatewayId = 
  | 'mercadopago' 
  | 'pushinpay'
  | 'stripe' 
  | 'pagseguro' 
  | 'cielo' 
  | 'rede'
  | 'getnet'
  | 'adyen'
  | 'paypal';

export type PaymentStatus = 
  | 'pending'
  | 'approved'
  | 'refused'
  | 'error'
  | 'cancelled'
  | 'refunded';

// ============================================
// CARD DATA TYPES
// ============================================

export interface CardData {
  number: string;
  holderName: string;
  holderDocument: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

export interface CardTokenData {
  token: string;
  brand?: string;
  lastFourDigits?: string;
  expirationMonth?: string;
  expirationYear?: string;
  holderName?: string;
  holderDocument?: string;
  paymentMethodId?: string;
  issuerId?: string;
  installments?: number;
}

// Alias para compatibilidade com código existente
export interface CardTokenResult {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  installments: number;
  holderDocument?: string; // CPF do titular do cartão (obrigatório para MP)
}

// ============================================
// INSTALLMENTS
// ============================================

export interface Installment {
  value: number;             // Número de parcelas (para select)
  installments?: number;     // Alias de value
  installmentAmount: number;
  totalAmount: number;
  interestRate?: number;
  hasInterest: boolean;
  label: string;
}

// ============================================
// CUSTOMER DATA
// ============================================

export interface CustomerData {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

// ============================================
// SPLIT PAYMENT (Multi-recipient)
// ============================================

export interface PaymentSplitRule {
  recipientId?: string;
  recipientEmail?: string;
  amountCents: number;
  role: 'platform' | 'affiliate' | 'producer';
  liable?: boolean;
}

// ============================================
// PAYMENT REQUEST/RESPONSE (Backend)
// ============================================

export interface PaymentRequest {
  amountCents: number;
  customer: CustomerData;
  orderId: string;
  description: string;
  cardToken?: string;
  installments?: number;
  splitRules?: PaymentSplitRule[];
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  qrCode?: string;
  qrCodeText?: string;
  rawResponse?: unknown;
  errorMessage?: string;
}

// ============================================
// PIX SPECIFIC
// ============================================

export interface PixPaymentData {
  qrCode: string;
  qrCodeText: string;
  expiresAt?: string;
  transactionId: string;
}

// ============================================
// GATEWAY CREDENTIALS
// ============================================

export interface GatewayCredentials {
  accessToken?: string;
  publicKey?: string;
  secretKey?: string;
  token?: string;
  environment?: 'sandbox' | 'production';
  [key: string]: unknown;
}

// ============================================
// FORM VALIDATION
// ============================================

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================
// GATEWAY INTERFACE (Abstract)
// ============================================

export interface IPaymentGateway {
  id: PaymentGatewayId;
  displayName: string;
  
  initialize?(credentials: GatewayCredentials): Promise<void>;
  createCardToken?(cardData: CardData): Promise<CardTokenData>;
  getInstallments?(amountCents: number, maxInstallments?: number): Installment[];
  getInterestRate?(): number;
  createPixPayment?(request: PaymentRequest): Promise<PixPaymentData>;
  createCardPayment?(request: PaymentRequest): Promise<PaymentResponse>;
  destroy?(): void;
}

// ============================================
// COMPONENT PROPS (Frontend)
// ============================================

export interface CardFormProps {
  publicKey: string;
  amount: number; // em centavos
  maxInstallments?: number; // Máximo de parcelas (default: 12)
  onSubmit: (result: CardTokenResult) => void | Promise<void>;
  onError?: (error: Error) => void;
  onReady?: () => void;
  onMount?: (submitFn: () => void) => void;
  isProcessing?: boolean;
  design?: {
    colors: {
      primaryText: string;
      secondaryText: string;
      formBackground: string;
      border: string;
    };
  };
}

export interface CardFormColors {
  text: string;
  placeholder: string;
  background: string;
  border: string;
  focusBorder: string;
}

export interface PixFormProps {
  gatewayId: PaymentGatewayId;
  amountCents: number;
  orderId: string;
  onPaymentCreated: (data: PixPaymentData) => void;
  onError?: (error: Error) => void;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseCardFormReturn {
  holderName: string;
  setHolderName: (value: string) => void;
  holderDocument: string;
  setHolderDocument: (value: string) => void;
  selectedInstallments: number;
  setSelectedInstallments: (value: number) => void;
  installments: Installment[];
  errors: Record<string, string>;
  validate: () => boolean;
  clearError: (field: string) => void;
  reset: () => void;
}

// ============================================
// SHARED FIELD PROPS (Form Components)
// ============================================

export interface SharedFieldProps {
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

// ============================================
// TYPE ALIASES (Compatibilidade)
// ============================================

export type GatewayType = PaymentGatewayId;
export type PaymentGateway = IPaymentGateway;
