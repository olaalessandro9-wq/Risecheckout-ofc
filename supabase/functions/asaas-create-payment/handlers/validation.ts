/**
 * Validation Handler - asaas-create-payment
 * 
 * Responsável por validações de entrada e rate limiting
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CustomerData } from "../../_shared/asaas-customer.ts";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "../../_shared/rate-limiting/index.ts";

// Use config from consolidated rate-limiting module

export interface PaymentRequest {
  vendorId?: string;
  orderId: string;
  amountCents: number;
  paymentMethod: 'pix' | 'credit_card';
  customer: CustomerData;
  description?: string;
  cardToken?: string;
  installments?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Verifica rate limiting
 */
export async function checkPaymentRateLimit(
  supabase: SupabaseClient,
  identifier: string
): Promise<{ allowed: boolean; retryAfter?: string }> {
  return await checkRateLimit(supabase, identifier, RATE_LIMIT_CONFIGS.CREATE_PIX);
}

/**
 * Registra tentativa de pagamento (agora é no-op, rate limiting já registra)
 */
export async function recordPaymentAttempt(
  _supabase: SupabaseClient,
  _identifier: string,
  _success: boolean
): Promise<void> {
  // Rate limiting consolidado já registra tentativas automaticamente
}

/**
 * Valida payload de pagamento
 */
export function validatePaymentPayload(payload: PaymentRequest): ValidationResult {
  const { orderId, amountCents, customer, paymentMethod, cardToken } = payload;

  if (!orderId || !amountCents || !customer) {
    return {
      valid: false,
      error: 'Campos obrigatórios: orderId, amountCents, customer',
      statusCode: 400
    };
  }

  if (paymentMethod === 'credit_card' && !cardToken) {
    return {
      valid: false,
      error: 'cardToken é obrigatório para pagamento com cartão',
      statusCode: 400
    };
  }

  return { valid: true };
}

/**
 * Busca vendor_id da order se não fornecido
 */
export async function resolveVendorId(
  supabase: SupabaseClient,
  orderId: string,
  providedVendorId?: string
): Promise<{ vendorId?: string; error?: string }> {
  if (providedVendorId) {
    return { vendorId: providedVendorId };
  }

  console.log('[asaas-create-payment] vendorId não fornecido, buscando da order...');
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('vendor_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !orderData) {
    console.error('[asaas-create-payment] Erro ao buscar order:', orderError);
    return { error: 'Pedido não encontrado' };
  }

  console.log('[asaas-create-payment] ✅ vendorId obtido da order:', orderData.vendor_id);
  return { vendorId: orderData.vendor_id };
}
