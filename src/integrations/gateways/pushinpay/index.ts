/**
 * PushinPay Gateway Module
 * 
 * Módulo centralizado para integração com o gateway de pagamento PIX da PushinPay.
 * 
 * @example
 * import * as PushinPay from "@/integrations/gateways/pushinpay";
 * 
 * // Usar hooks
 * const { data: integration } = PushinPay.usePushinPayConfig(vendorId);
 * const isAvailable = PushinPay.usePushinPayAvailable(integration);
 * 
 * // Usar API
 * const result = await PushinPay.createPixCharge(orderId, valueInCents);
 * const status = await PushinPay.getPixStatus(orderId);
 */

// Tipos
export * from "./types";

// API
export * from "./api";

// Hooks
export * from "./hooks";

// Componentes
export { QRCanvas } from "./components/QRCanvas";
export { Legal } from "./components/Legal";
export { ConfigForm } from "./components/ConfigForm";
