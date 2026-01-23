/**
 * ============================================================================
 * ASAAS CREATE PAYMENT - Edge Function
 * ============================================================================
 * 
 * RISE ARCHITECT PROTOCOL V3 - ADAPTER PATTERN COMPLIANCE
 * 
 * MODELO MARKETPLACE ASAAS - RiseCheckout
 * Usa PaymentFactory + AsaasAdapter para garantir:
 * - Validação de preço integrada
 * - Circuit Breaker
 * - Timeout de 15s
 * - Zero duplicação de código
 * 
 * @module asaas-create-payment
 * @version 6.0.0 - RISE V3 Compliant (Adapter Pattern)
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Módulos compartilhados
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { getGatewayCredentials, validateCredentials } from "../_shared/platform-config.ts";
import { calculateMarketplaceSplitData } from "../_shared/asaas-split-calculator.ts";
import { getIdentifier } from "../_shared/rate-limiting/index.ts";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { createLogger } from "../_shared/logger.ts";

// RISE V3: Usar PaymentFactory + Adapter
import { PaymentFactory, PaymentRequest as AdapterPaymentRequest } from "../_shared/payment-gateways/index.ts";

// Handlers locais (apenas tipos e validação)
import { 
  PaymentRequest,
  checkPaymentRateLimit, 
  recordPaymentAttempt,
  validatePaymentPayload,
  resolveVendorId
} from "./handlers/validation.ts";
import { createSuccessResponse, createErrorResponse, createRateLimitResponse } from "./handlers/response-builder.ts";

const log = createLogger("asaas-create-payment");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  // ============================================================================
  // CORS V2 - Dynamic Origin Handling
  // ============================================================================
  const corsResult = handleCorsV2(req);
  
  let corsHeaders: Record<string, string>;
  if (corsResult instanceof Response) {
    if (req.method === 'OPTIONS') {
      return corsResult;
    }
    corsHeaders = PUBLIC_CORS_HEADERS;
  } else {
    corsHeaders = corsResult.headers;
  }

  const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const identifier = getIdentifier(req);

  // Rate Limiting
  const rateLimitResult = await checkPaymentRateLimit(supabase, identifier);
  if (!rateLimitResult.allowed) {
    log.warn('Rate limit exceeded', { identifier });
    return createRateLimitResponse(rateLimitResult.retryAfter, corsHeaders);
  }

  try {
    const payload: PaymentRequest = await req.json();
    
    log.info('RISE V3 - Using PaymentFactory + AsaasAdapter', {
      orderId: payload.orderId,
      vendorId: payload.vendorId,
      amountCents: payload.amountCents,
      paymentMethod: payload.paymentMethod
    });

    // Validação do payload
    const validation = validatePaymentPayload(payload);
    if (!validation.valid) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(validation.error!, validation.statusCode, corsHeaders);
    }

    // Resolver vendorId
    const vendorResult = await resolveVendorId(supabase, payload.orderId, payload.vendorId);
    if (vendorResult.error) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(vendorResult.error, 404, corsHeaders);
    }
    const vendorId = vendorResult.vendorId!;

    // Buscar credenciais
    const credResult = await getGatewayCredentials(supabase, vendorId, 'asaas');
    if (!credResult.success || !credResult.credentials) {
      log.error('Falha ao buscar credenciais', { error: credResult.error });
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(credResult.error || 'Credenciais não encontradas', 500, corsHeaders);
    }
    const { credentials, isOwner } = credResult;
    const credValidation = validateCredentials('asaas', credentials);
    if (!credValidation.valid) {
      log.error('Credenciais inválidas', { missingFields: credValidation.missingFields });
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(`Credenciais Asaas faltando: ${credValidation.missingFields.join(', ')}`, 500, corsHeaders);
    }

    const apiKey = credentials.apiKey || credentials.api_key || '';
    const environment = credentials.environment === 'sandbox' ? 'sandbox' : 'production';

    log.info('Credenciais obtidas', { 
      type: isOwner ? 'Owner' : 'Vendor', 
      environment 
    });

    // Calcular split
    const splitData = await calculateMarketplaceSplitData(supabase, payload.orderId, vendorId);
    log.info('Split calculado', splitData);

    // Calcular valores em centavos baseado na porcentagem
    const affiliateCommissionCents = splitData.hasAffiliate 
      ? Math.round(payload.amountCents * (splitData.affiliateCommissionPercent / 100))
      : 0;
    // Platform fee: 4% sobre o total (modelo marketplace padrão)
    const platformFeeCents = isOwner ? 0 : Math.round(payload.amountCents * 0.04);
    const vendorNetCents = payload.amountCents - platformFeeCents - affiliateCommissionCents;

    // ============================================================================
    // RISE V3: USAR PAYMENTFACTORY + ASAASADAPTER
    // ============================================================================
    const gateway = PaymentFactory.create('asaas', {
      api_key: apiKey,
      environment
    }, supabase);

    // Montar PaymentRequest no formato do Adapter
    const adapterRequest: AdapterPaymentRequest = {
      amount_cents: payload.amountCents,
      order_id: payload.orderId,
      customer: {
        name: payload.customer.name,
        email: payload.customer.email,
        document: payload.customer.document
      },
      description: payload.description || `Pedido ${payload.orderId.slice(0, 8)}`,
      card_token: payload.cardToken,
      installments: payload.installments,
      split_rules: splitData.hasAffiliate && splitData.affiliateWalletId ? [
        {
          recipient_id: splitData.affiliateWalletId,
          amount_cents: affiliateCommissionCents,
          role: 'affiliate' as const
        }
      ] : undefined
    };

    // Executar pagamento via Adapter (validação de preço JÁ ESTÁ INTEGRADA)
    let result;
    if (payload.paymentMethod === 'pix') {
      result = await gateway.createPix(adapterRequest);
    } else if (payload.paymentMethod === 'credit_card') {
      result = await gateway.createCreditCard(adapterRequest);
    } else {
      return createErrorResponse('Método de pagamento inválido', 400, corsHeaders);
    }

    if (!result.success) {
      log.error('Adapter returned error', { error: result.error_message });
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(result.error_message || 'Erro ao processar pagamento', 400, corsHeaders);
    }

    // Atualizar ordem
    await supabase
      .from('orders')
      .update({
        platform_fee_cents: platformFeeCents,
        commission_cents: affiliateCommissionCents,
        gateway_payment_id: result.transaction_id
      })
      .eq('id', payload.orderId);

    // Registrar sucesso
    await recordPaymentAttempt(supabase, identifier, true);
    
    await logSecurityEvent(supabase, {
      userId: vendorId,
      action: SecurityAction.PROCESS_PAYMENT,
      resource: 'orders',
      resourceId: payload.orderId,
      success: true,
      request: req,
      metadata: {
        gateway: 'asaas',
        paymentMethod: payload.paymentMethod,
        amountCents: payload.amountCents,
        paymentId: result.transaction_id,
        hasAffiliate: splitData.hasAffiliate,
        platformFeeCents,
        affiliateCommissionCents,
        riseV3: true,
        adapterUsed: 'AsaasAdapter'
      }
    });

    return createSuccessResponse({
      chargeId: result.transaction_id,
      status: result.status,
      qrCode: result.qr_code,
      qrCodeText: result.qr_code_text,
      splitApplied: splitData.hasAffiliate,
      platformFeeCents,
      affiliateCommissionCents,
      vendorNetCents,
      hasAffiliate: splitData.hasAffiliate,
      rawResponse: (result.raw_response as Record<string, unknown>) || {}
    }, corsHeaders);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    log.error('Exception', { message: errorMessage });
    await recordPaymentAttempt(supabase, identifier, false);
    return createErrorResponse(errorMessage, 500, corsHeaders);
  }
});
