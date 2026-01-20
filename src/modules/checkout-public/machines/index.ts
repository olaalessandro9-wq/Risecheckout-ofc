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
  submitPaymentActor,
} from "./checkoutPublicMachine.actors";

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
