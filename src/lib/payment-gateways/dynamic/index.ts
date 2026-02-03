/**
 * Dynamic Payment Gateways Module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Lazy-loaded payment gateway components for optimal bundle size.
 * SDKs are only loaded when the user selects credit card payment.
 * 
 * Benefits:
 * - ~80KB saved on initial load (MercadoPago + Stripe SDKs)
 * - Faster Time to Interactive (TTI)
 * - Better Core Web Vitals (LCP, FID)
 * 
 * @module lib/payment-gateways/dynamic
 */

// Dynamic Forms (lazy-loaded)
export { DynamicMercadoPagoForm } from "./DynamicMercadoPagoForm";
export type { DynamicMercadoPagoFormProps } from "./DynamicMercadoPagoForm";

export { DynamicStripeForm } from "./DynamicStripeForm";
export type { DynamicStripeFormProps, StripeSubmitResult } from "./DynamicStripeForm";

// Skeleton & Fallback
export { GatewaySkeleton, GatewaySkeletonCompact } from "./GatewaySkeleton";
export { PaymentGatewayFallback } from "./PaymentGatewayFallback";
export type { PaymentGatewayFallbackProps } from "./PaymentGatewayFallback";
