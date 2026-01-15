/**
 * Types for MercadoPago Payment Page
 * 
 * Single Responsibility: Type definitions only.
 * RISE Protocol V2 Compliant.
 */

/**
 * Estado do pagamento
 */
export type PaymentStatus = "loading" | "waiting" | "paid" | "expired" | "error";

/**
 * Interface para dados do pedido retornados pela RPC
 */
export interface MercadoPagoOrderData {
  id: string;
  status: string;
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_document: string | null;
  product_name?: string | null;
  product_id?: string;
  payment_method?: string | null;
  pix_qr_code?: string | null;
  pix_status?: string | null;
  vendor_id?: string;
  created_at?: string;
  tracking_parameters?: unknown;
}

/**
 * Interface para navigation state com access_token
 */
export interface PaymentNavigationState {
  accessToken?: string;
}

/**
 * Interface para resultado da criação do pagamento
 */
export interface CreatePaymentResult {
  success: boolean;
  paymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  error?: string;
}
