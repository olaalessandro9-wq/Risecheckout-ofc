/**
 * Payment Hooks - Barrel Export
 * 
 * Módulo refatorado de pagamento com hooks especializados.
 * 
 * Arquitetura:
 * - usePaymentOrchestrator: Hook principal (facade)
 * - useOrderCreation: Criação de pedidos
 * - usePixPayment: Processamento PIX
 * - useCardPayment: Processamento cartão
 */

// Hook principal (substitui usePaymentGateway)
export { usePaymentOrchestrator } from './usePaymentOrchestrator';

// Hooks especializados (para uso direto quando necessário)
export { useOrderCreation } from './useOrderCreation';
export { usePixPayment } from './usePixPayment';
export { useCardPayment } from './useCardPayment';

// Tipos
export type { 
  PixGateway, 
  CreditCardGateway, 
  AppliedCoupon,
  CardPaymentData,
  PaymentConfig,
  PaymentState,
  CreateOrderPayload,
  CreateOrderResult,
  PixNavigationState,
  SuccessNavigationState
} from './types';
