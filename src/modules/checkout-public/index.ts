/**
 * Checkout Public Module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Complete XState-based checkout flow for public checkout pages.
 * 
 * Architecture:
 * - contracts/: Zod schemas for BFF response validation
 * - mappers/: DTO to UI model transformations
 * - machines/: XState state machine with types, actors, guards
 * - hooks/: React hook for machine integration
 * - components/: UI components (Loader, Content, ErrorDisplay)
 * 
 * @module checkout-public
 */

// === Components (Main Exports) ===
export { CheckoutPublicLoader, CheckoutPublicContent, CheckoutErrorDisplay } from "./components";

// === Hooks ===
export { useCheckoutPublicMachine, type UseCheckoutPublicMachineReturn } from "./hooks";

// === Machines ===
export {
  checkoutPublicMachine,
  initialCheckoutContext,
  type CheckoutPublicMachine,
  type CheckoutPublicContext,
  type CheckoutPublicEvent,
  type FormData,
  type FormErrors,
  type CouponData,
  type PaymentData,
  type ErrorReason,
  type CheckoutError,
} from "./machines";

// === Contracts ===
export {
  ResolveAndLoadResponseSchema,
  validateResolveAndLoadResponse,
  type ResolveAndLoadResponse,
  type AffiliateData,
  type OfferData,
  type OrderBumpData,
  type ProductData,
  type CheckoutData,
} from "./contracts";

// === Mappers ===
export {
  mapResolveAndLoad,
  type MappedCheckoutData,
  type CheckoutUIModel,
  type ProductUIModel,
  type OfferUIModel,
  type AffiliateUIModel,
  type OrderBumpUIModel,
  type ResolvedGateways,
  type PixGateway,
  type CreditCardGateway,
} from "./mappers";
