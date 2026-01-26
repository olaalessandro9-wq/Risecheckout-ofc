/**
 * Payment Hooks - Barrel Export
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este módulo foi refatorado. O fluxo de pagamento agora é 100% XState.
 * Hooks anteriores foram removidos após migração para XState.
 * 
 * O processamento de pagamento acontece em:
 * - src/modules/checkout-public/machines/actors/createOrderActor.ts
 * - src/modules/checkout-public/machines/actors/processPixPaymentActor.ts
 * - src/modules/checkout-public/machines/actors/processCardPaymentActor.ts
 */

// Tipos (mantidos para compatibilidade)
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
