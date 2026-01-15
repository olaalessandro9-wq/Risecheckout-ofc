/**
 * Re-exports de Tipos - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/types/index.ts
 * RISE ARCHITECT PROTOCOL V2 - Zero Breaking Changes
 */

// Connection Types
export type { ConnectionMode } from './connection';
export type { IntegrationData } from './connection';
export type { GatewayPropertyValue } from './connection';
export type { MercadoPagoConfig } from './connection';
export type { MercadoPagoIntegration } from './connection';
export type { MercadoPagoGlobalParams } from './connection';

// Payment Types
export type { MercadoPagoCustomer } from './payment';
export type { MercadoPagoItem } from './payment';
export type { MercadoPagoPaymentMethodsConfig } from './payment';
export type { MercadoPagoPreference } from './payment';
export type { MercadoPagoPreferenceResponse } from './payment';
export type { MercadoPagoPaymentResponse } from './payment';
export type { MercadoPagoError } from './payment';
export type { MercadoPagoResponse } from './payment';

// Brick Types
export type { MercadoPagoBrickPayment } from './brick';
export type { BrickCallbacks } from './brick';
export type { BrickCustomizations } from './brick';
export type { BrickConfig } from './brick';
