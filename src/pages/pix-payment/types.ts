/**
 * Tipos compartilhados para a página de pagamento PIX
 */

export type GatewayType = 'mercadopago' | 'pushinpay' | 'asaas' | 'stripe';

export type PaymentStatus = 'waiting' | 'paid' | 'expired';

/**
 * Dados que vêm do usePaymentGateway via navigation state
 */
export interface PixNavigationState {
  qrCode?: string;
  qrCodeBase64?: string;
  qrCodeText?: string; // Asaas usa qrCodeText para o código PIX copia e cola
  amount?: number;
  accessToken?: string;
  gateway?: GatewayType;
}

/**
 * Dados do pedido retornados pela RPC
 */
export interface OrderDataFromRpc {
  id: string;
  amount_cents: number;
  vendor_id: string;
  product_id?: string;
  product?: {
    id: string;
    name: string;
  } | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_document?: string | null;
  created_at?: string;
  tracking_parameters?: Record<string, unknown> | null;
  status?: string;
  pix_qr_code?: string | null;
  pix_status?: string | null;
}
