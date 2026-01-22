/**
 * Re-exports dos hooks de pagamento PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Hooks disponíveis:
 * - usePixOrderData: Busca dados do pedido para exibição
 * - usePixCharge: Gera cobrança PIX (legacy, usado por alguns gateways)
 * - usePixPaymentStatus: Polling de status do pagamento
 * - usePixTimer: Timer de expiração do PIX (15 minutos)
 * - useCheckoutSlugFromOrder: Obtém slug do checkout a partir do pedido
 * - usePixRecovery: Recuperação resiliente de dados PIX (v1.2)
 * 
 * Arquitetura de Recuperação (v1.2):
 * 1. Tentar usar dados do navState (mais rápido, já tem QR)
 * 2. Se não houver navState, chamar get-pix-status (RPC pública)
 * 3. Se PIX existe no banco, usar diretamente
 * 4. Se não existe, mostrar erro (sem accessToken não pode criar novo)
 * 
 * Tipos centralizados em: src/types/checkout-payment.types.ts (SSOT)
 * 
 * @see docs/PIX_PAYMENT_RESILIENCE.md
 * @module pix-payment/hooks
 */

export { usePixOrderData } from "./usePixOrderData";
export { usePixCharge } from "./usePixCharge";
export { usePixPaymentStatus } from "./usePixPaymentStatus";
export { usePixTimer } from "./usePixTimer";
export { useCheckoutSlugFromOrder } from "./useCheckoutSlugFromOrder";
export { usePixRecovery } from "./usePixRecovery";
export type { RecoveryStatus, RecoveredPixData, UsePixRecoveryReturn } from "./usePixRecovery";
