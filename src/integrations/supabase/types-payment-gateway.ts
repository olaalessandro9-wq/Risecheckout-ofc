/**
 * Tipos para payment_gateway_settings
 * Tipos pendentes de integração com schema oficial do Supabase
 */

export interface PaymentGatewaySettings {
  user_id: string;
  pushinpay_token?: string;
  token_encrypted?: string;
  environment: 'sandbox' | 'production';
  platform_fee_percent?: number;
  created_at?: string;
  updated_at?: string;
}
