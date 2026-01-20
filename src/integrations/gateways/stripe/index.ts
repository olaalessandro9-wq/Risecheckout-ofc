/**
 * Stripe Gateway Module
 * 
 * @module integrations/gateways/stripe
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Barrel export para o módulo de integração com Stripe.
 * Agora segue a mesma estrutura de Asaas, MercadoPago e PushinPay.
 * 
 * @example
 * import * as Stripe from "@/integrations/gateways/stripe";
 * 
 * // Usar hooks
 * const { status, isConnected } = Stripe.useStripeConnectionStatus();
 * 
 * // Usar API
 * const result = await Stripe.startStripeConnect();
 */

// Types
export * from "./types";

// API
export {
  getStripeConnectionStatus,
  startStripeConnect,
  disconnectStripe,
  isStripeConnected,
  getStripeConfig,
} from "./api";

// Hooks
export {
  useStripeConfig,
  useStripeConnectionStatus,
  useStripeConnect,
  useStripeDisconnect,
  useStripeOAuthCallback,
} from "./hooks";

// Components
export { ConfigForm } from "./components/ConfigForm";
export { ConnectionStatus } from "./components/ConnectionStatus";
export { ConnectButton } from "./components/ConnectButton";
export { InfoCard } from "./components/InfoCard";
