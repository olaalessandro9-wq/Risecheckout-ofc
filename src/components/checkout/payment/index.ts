/**
 * Payment Module - Barrel Export
 * 
 * Módulo completo de pagamento multi-gateway.
 * Exporta componentes, hooks e tipos para uso externo.
 */

// ============================================
// COMPONENTES PRINCIPAIS
// ============================================

export { CreditCardForm } from './CreditCardForm';
export type { CreditCardFormProps, CardTokenData, CreditCardFormRef } from './CreditCardForm';

export { GatewayCardForm } from './GatewayCardForm';
export type { GatewayCardFormProps } from './GatewayCardForm';

// ============================================
// CAMPOS COMPARTILHADOS
// ============================================

export {
  CardHolderNameField,
  CPFField,
  InstallmentsField,
  SecurityBadge,
} from './fields/shared';

// ============================================
// CAMPOS ESPECÍFICOS DOS GATEWAYS
// ============================================

export {
  MercadoPagoFields,
} from './fields/gateways';

export type {
  MercadoPagoFieldsProps,
  MercadoPagoFieldsRef,
} from './fields/gateways';

// ============================================
// HOOKS
// ============================================

export {
  useGatewayManager,
} from './hooks';

export type {
  GatewayConfig,
  UseGatewayManagerProps,
  UseGatewayManagerReturn,
} from './hooks';

// ============================================
// TYPES E INTERFACES
// ============================================

export type {
  PaymentGatewayId as PaymentGatewayType,
  GatewayCredentials as PaymentGatewayConfig,
  CardData,
  CardTokenData as CoreCardTokenData,
  Installment,
  FieldError,
  ValidationResult,
  SharedFieldProps,
  IPaymentGateway as PaymentGateway,
  UseCardFormReturn,
} from '@/types/payment-types';

// Re-export specific types from local components
export type { CreditCardFormProps as CoreCreditCardFormProps, CreditCardFormRef as CoreCreditCardFormRef } from './CreditCardForm';
export type { GatewayConfig as CardFieldsProps } from './hooks';

// Local interface for ref compatibility
export interface CardFieldsRef {
  submit: () => Promise<void>;
  reset: () => void;
}

export interface UseGatewayCardReturn {
  isReady: boolean;
  fieldErrors: Record<string, string>;
  installments: import('@/types/payment-types').Installment[];
  clearFieldError: (field: string) => void;
  submit: () => Promise<import('@/types/payment-types').CardTokenData>;
}

// ============================================
// CONSTANTES
// ============================================

export {
  INPUT_BASE_CLASS,
  INPUT_ERROR_CLASS,
  INPUT_DISABLED_CLASS,
  LABEL_CLASS,
  ERROR_MESSAGE_CLASS,
  VALIDATION_MESSAGES,
  GATEWAY_DISPLAY_NAMES,
  CARD_BRANDS,
  PATTERNS,
} from './core/constants';
