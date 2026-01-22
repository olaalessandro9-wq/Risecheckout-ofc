/**
 * Checkout Public Machines - Barrel Exports
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This module exports the XState state machine for the public checkout flow.
 * 
 * Architecture (v1.2):
 * - checkoutPublicMachine.ts (278 linhas) - State Machine principal
 * - checkoutPublicMachine.context.ts (65 linhas) - Contexto inicial extraído
 * - checkoutPublicMachine.types.ts - Context, Events, tipos de Actor
 * - checkoutPublicMachine.guards.ts - Guards puros de validação
 * - checkoutPublicMachine.actions.ts - Helpers para assign() e criação de erros
 * - checkoutPublicMachine.inputs.ts - Factories para input de actors
 * - actors/ - Actors especializados (createOrder, processPix, processCard)
 * 
 * PIX Flow (v1.2):
 * - PushinPay agora gera QR no processPixPaymentActor (unificado com outros gateways)
 * - usePixRecovery + get-pix-status para recuperação resiliente
 * 
 * Tipos centralizados em: src/types/checkout-payment.types.ts (SSOT)
 * 
 * @see docs/CHECKOUT_PUBLIC_MODULE_ARCHITECTURE.md
 * @module checkout-public/machines
 */

// State Machine
export { checkoutPublicMachine } from "./checkoutPublicMachine";
export type { CheckoutPublicMachine } from "./checkoutPublicMachine";

// Context (extracted for 300-line compliance)
export { initialCheckoutContext } from "./checkoutPublicMachine.context";

// Input Factories (extracted for 300-line compliance)
export { calculateTotalFromContext, createOrderInput, processPixInput, processCardInput } from "./checkoutPublicMachine.inputs";

// Types
export type {
  CheckoutPublicContext,
  CheckoutPublicEvent,
  FormData,
  FormErrors,
  CouponData,
  PixPaymentData,
  CardPaymentData,
  PaymentData,
  PixNavigationData,
  CardNavigationData,
  NavigationData,
  CardFormData,
  ErrorReason,
  CheckoutError,
  FetchCheckoutInput,
  FetchCheckoutOutput,
  SubmitPaymentInput,
  SubmitPaymentOutput,
} from "./checkoutPublicMachine.types";

// Guards
export {
  canRetry,
  isDataValid,
  hasRequiredFormFields,
  isFormValid,
  hasCheckout,
  hasProduct,
  isReady,
} from "./checkoutPublicMachine.guards";

// Actors
export {
  fetchCheckoutDataActor,
} from "./checkoutPublicMachine.actors";

// Payment Actors
export {
  createOrderActor,
  processPixPaymentActor,
  processCardPaymentActor,
} from "./actors";

export type {
  CreateOrderInput,
  CreateOrderOutput,
  ProcessPixInput,
  ProcessPixOutput,
  ProcessCardInput,
  ProcessCardOutput,
} from "./actors";

// Action Helpers
export {
  getValidatedContextData,
  toggleBumpInArray,
  removeFieldError,
  createFetchError,
  createNetworkError,
  createValidationError,
  createSubmitError,
  createPaymentError,
  createPaymentTimeoutError,
} from "./checkoutPublicMachine.actions";
