/**
 * Asaas Gateway API - Barrel Export
 * 
 * @module integrations/gateways/asaas/api
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Re-exporta todas as funções da API do Asaas para manter compatibilidade.
 */

// Validation
export { validateAsaasCredentials } from './validation-api';

// Payments
export {
  createAsaasPixPayment,
  createAsaasCreditCardPayment,
} from './payment-api';

// Settings
export {
  getAsaasSettings,
  saveAsaasSettings,
  disconnectAsaas,
  isAsaasConnected,
} from './settings-api';
