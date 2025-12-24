/**
 * Payment Gateways Module
 * 
 * Módulo central para gerenciamento de gateways de pagamento.
 * 
 * Uso:
 * ```typescript
 * import { getGateway, MercadoPagoCardForm } from '@/lib/payment-gateways';
 * 
 * const gateway = getGateway('mercadopago');
 * const installments = gateway.generateInstallments(10000); // R$ 100,00
 * ```
 */

// Types
export type { 
  CardTokenResult, 
  Installment, 
  CardFormProps, 
  IPaymentGateway as PaymentGateway,
  PaymentGatewayId as GatewayType 
} from '@/types/payment-types';

// Factory
export { getGateway, getAvailableGateways, isGatewaySupported } from './gateway-factory';

// Utilities
export { generateInstallments, formatCurrency } from './installments';

// Gateway Components
export { MercadoPagoCardForm, mercadoPagoGateway } from './gateways/mercado-pago';
