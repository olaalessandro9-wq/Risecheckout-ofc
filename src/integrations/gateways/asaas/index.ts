/**
 * Asaas Gateway Module
 * 
 * Barrel export para o módulo de integração com Asaas.
 * Suporta PIX e Cartão de Crédito.
 */

// Types
export * from './types';

// API functions (modularized)
export {
  validateAsaasCredentials,
  createAsaasPixPayment,
  createAsaasCreditCardPayment,
  getAsaasSettings,
  saveAsaasSettings,
  disconnectAsaas,
  isAsaasConnected,
} from './api/index';

// Hooks
export {
  useAsaasConfig,
  useAsaasValidation,
  useAsaasSaveConfig,
  useAsaasDisconnect,
  useAsaasConnectionStatus,
} from './hooks';

// Components
export { ConfigForm } from './components/ConfigForm';
