/**
 * Payment Gateways Module - Barrel Export
 * 
 * Este arquivo centraliza todos os exports do módulo de gateways de pagamento,
 * facilitando os imports em outros arquivos.
 * 
 * @example
 * ```typescript
 * // Import tudo que você precisa de um único lugar
 * import { 
 *   PaymentFactory, 
 *   PaymentRequest, 
 *   PaymentResponse,
 *   IPaymentGateway 
 * } from "../_shared/payment-gateways/index.ts";
 * 
 * // Usar
 * const gateway = PaymentFactory.create('mercadopago', credentials);
 * const result: PaymentResponse = await gateway.createPix(request);
 * ```
 */

// Exports principais
export { PaymentFactory } from "./PaymentFactory.ts";
export type { IPaymentGateway } from "./IPaymentGateway.ts";

// Exports de tipos
export type {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  GatewayCredentials
} from "./types.ts";

// Exports de adaptadores (caso precise usar diretamente)
export { MercadoPagoAdapter } from "./adapters/MercadoPagoAdapter.ts";
export { PushinPayAdapter } from "./adapters/PushinPayAdapter.ts";
export { StripeAdapter } from "./adapters/StripeAdapter.ts";
