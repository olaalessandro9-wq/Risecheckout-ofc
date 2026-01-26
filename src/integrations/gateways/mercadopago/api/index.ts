/**
 * Re-exports de API - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/api/index.ts
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
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
