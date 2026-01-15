/**
 * Re-exports de API - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/api/index.ts
 * RISE ARCHITECT PROTOCOL V2 - Zero Breaking Changes
 * 
 * Mantém compatibilidade total com imports existentes.
 */

// Payment API
export {
  createPreference,
  processPayment,
  getPayment,
} from './payment-api';

// SDK Utils
export {
  isValidConfig,
  initializeMercadoPago,
} from './sdk-utils';
