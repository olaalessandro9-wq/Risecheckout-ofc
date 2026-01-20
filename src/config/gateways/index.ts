/**
 * Gateway Registry Module
 * 
 * @module config/gateways
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Barrel export para o módulo de registro de gateways.
 * 
 * @example
 * import { GATEWAY_REGISTRY, getGatewayById, GatewayId } from '@/config/gateways';
 * 
 * const stripe = getGatewayById('stripe');
 * console.log(stripe.name); // "Stripe"
 */

// Types
export type {
  GatewayId,
  IntegrationType,
  GatewayStatus,
  GatewayEnvironment,
  PaymentMethod,
  GatewayCapabilities,
  GatewayAuthType,
  GatewayFees,
  GatewayDefinition,
  GatewayConnectionStatus,
  GatewayConnectionMap,
  GatewayCredentialStatus,
  GatewayCredentialsMap,
  GatewayWithStatus,
  GatewayConfigFormProps,
} from './types';

// Registry & Constants
export {
  GATEWAY_REGISTRY,
  GATEWAY_ORDER,
  INTEGRATION_TYPE_MAP,
  GATEWAY_ID_MAP,
} from './registry';

// Helper Functions
export {
  getGatewayById,
  getAllGateways,
  getGatewaysByStatus,
  getActiveGateways,
  getGatewaysByPaymentMethod,
  getActiveGatewaysByPaymentMethod,
  getPixGateways,
  getCreditCardGateways,
  isValidGatewayId,
  formatGatewayFees,
  integrationTypeToGatewayId,
  gatewayIdToIntegrationType,
} from './registry';
