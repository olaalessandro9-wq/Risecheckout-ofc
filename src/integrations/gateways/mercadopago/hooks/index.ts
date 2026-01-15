/**
 * Barrel export para hooks do Mercado Pago Gateway
 * 
 * Mantém compatibilidade com imports existentes enquanto
 * organiza hooks em arquivos individuais < 300 linhas cada
 */

// Re-exports dos hooks individuais
export { useMercadoPagoConfig } from './useMercadoPagoConfig';
export { useMercadoPagoInit } from './useMercadoPagoInit';
export { useMercadoPagoAvailable } from './useMercadoPagoAvailable';
export { useMercadoPagoBrick } from './useMercadoPagoBrick';
export { useMercadoPagoConnection } from './useMercadoPagoConnection';
export { useMercadoPagoSandbox } from './useMercadoPagoSandbox';

// Re-exports dos tipos
export type { 
  UseMercadoPagoBrickProps, 
  FieldErrors,
  MercadoPagoBrickReturn,
  MercadoPagoInstallment,
  MercadoPagoTokenResult
} from './useMercadoPagoBrick';
