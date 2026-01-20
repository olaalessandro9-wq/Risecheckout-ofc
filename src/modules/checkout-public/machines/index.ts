/**
 * Checkout Public Machines Module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Barrel exports for the XState state machine.
 * 
 * @module checkout-public/machines
 */

// State Machine
export { checkoutPublicMachine, initialCheckoutContext } from "./checkoutPublicMachine";
export type { CheckoutPublicMachine } from "./checkoutPublicMachine";

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
