/**
 * ============================================================================
 * ASAAS CREATE PAYMENT - Edge Function
 * ============================================================================
 * 
 * MODELO MARKETPLACE ASAAS - RiseCheckout
 * Todas cobranças na conta RiseCheckout. Split BINÁRIO (nunca 3 partes).
 * 
 * Cenários:
 * 1. OWNER DIRETO: 100% RiseCheckout
 * 2. OWNER + AFILIADO: Afiliado recebe X% * 0.96, Owner recebe resto
 * 3. VENDEDOR COMUM: 96% vendedor, 4% plataforma
 * 
 * @module asaas-create-payment
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Módulos compartilhados
import { getGatewayCredentials, validateCredentials } from "../_shared/platform-config.ts";
import { findOrCreateCustomer } from "../_shared/asaas-customer.ts";
import { calculateMarketplaceSplitData } from "../_shared/asaas-split-calculator.ts";
import { getIdentifier } from "../_shared/rate-limiting/index.ts";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { createLogger } from "../_shared/logger.ts";

// Handlers locais
import { 
  PaymentRequest,
  checkPaymentRateLimit, 
  recordPaymentAttempt,
  validatePaymentPayload,
  resolveVendorId
} from "./handlers/validation.ts";
import { buildSplitRules } from "./handlers/split-builder.ts";
import { buildChargePayload, createAsaasCharge, getPixQrCode, triggerPixGeneratedWebhook } from "./handlers/charge-creator.ts";
import { corsHeaders, createSuccessResponse, createErrorResponse, createRateLimitResponse } from "./handlers/response-builder.ts";

const log = createLogger("asaas-create-payment");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const identifier = getIdentifier(req);

  // Rate Limiting
  const rateLimitResult = await checkPaymentRateLimit(supabase, identifier);
  if (!rateLimitResult.allowed) {
    log.warn('Rate limit exceeded', { identifier });
    return createRateLimitResponse(rateLimitResult.retryAfter);
  }

  try {
    const payload: PaymentRequest = await req.json();
    
    log.info('MODELO MARKETPLACE ASAAS', {
      orderId: payload.orderId,
      vendorId: payload.vendorId,
      amountCents: payload.amountCents,
      paymentMethod: payload.paymentMethod,
      hasCardToken: !!payload.cardToken
    });

    // Validação do payload
    const validation = validatePaymentPayload(payload);
    if (!validation.valid) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(validation.error!, validation.statusCode);
    }

    // Resolver vendorId
    const vendorResult = await resolveVendorId(supabase, payload.orderId, payload.vendorId);
    if (vendorResult.error) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(vendorResult.error, 404);
    }
    const vendorId = vendorResult.vendorId!;

    // Buscar credenciais
    const credResult = await getGatewayCredentials(supabase, vendorId, 'asaas');
    if (!credResult.success || !credResult.credentials) {
      log.error('Falha ao buscar credenciais', { error: credResult.error });
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(credResult.error || 'Credenciais não encontradas', 500);
    }
    const { credentials, isOwner } = credResult;
    const credValidation = validateCredentials('asaas', credentials);
    if (!credValidation.valid) {
      log.error('Credenciais inválidas', { missingFields: credValidation.missingFields });
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(`Credenciais Asaas faltando: ${credValidation.missingFields.join(', ')}`, 500);
    }

    const baseUrl = credentials.environment === 'sandbox'
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';
    const apiKey = credentials.apiKey || credentials.api_key || '';

    log.info('Credenciais obtidas', { 
      type: isOwner ? 'Owner' : 'Vendor', 
      environment: credentials.environment 
    });

    // Calcular split
    const splitData = await calculateMarketplaceSplitData(supabase, payload.orderId, vendorId);
    log.info('Split calculado', splitData);

    // Criar customer
    const asaasCustomer = await findOrCreateCustomer(baseUrl, apiKey, payload.customer);
    if (!asaasCustomer) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse('Erro ao criar/buscar cliente no Asaas', 500);
    }

    // Montar split rules
    const splitResult = buildSplitRules(splitData, payload.amountCents);
    if (splitResult.error) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(splitResult.error, 400);
    }

    // Criar cobrança
    const chargePayload = buildChargePayload({
      customerId: asaasCustomer.id,
      orderId: payload.orderId,
      amountCents: payload.amountCents,
      paymentMethod: payload.paymentMethod,
      description: payload.description,
      splitRules: splitResult.splitRules,
      cardToken: payload.cardToken,
      installments: payload.installments
    });

    const chargeResult = await createAsaasCharge(baseUrl, apiKey, chargePayload);
    if (!chargeResult.success) {
      await recordPaymentAttempt(supabase, identifier, false);
      return createErrorResponse(chargeResult.error!, 400);
    }

    const chargeData = chargeResult.chargeData!;

    // Atualizar ordem
    await supabase
      .from('orders')
      .update({
        platform_fee_cents: splitResult.platformFeeCents,
        commission_cents: splitResult.affiliateCommissionCents,
        gateway_payment_id: chargeData.id
      })
      .eq('id', payload.orderId);

    // Se PIX, obter QR Code e disparar webhook
    let qrCode: string | undefined;
    let qrCodeText: string | undefined;

    if (payload.paymentMethod === 'pix') {
      const qrResult = await getPixQrCode(baseUrl, apiKey, chargeData.id as string);
      qrCode = qrResult.qrCode;
      qrCodeText = qrResult.qrCodeText;

      await triggerPixGeneratedWebhook(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, payload.orderId);
    }

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
        paymentId: chargeData.id,
        hasAffiliate: splitData.hasAffiliate,
        platformFeeCents: splitResult.platformFeeCents,
        affiliateCommissionCents: splitResult.affiliateCommissionCents
      }
    });

    return createSuccessResponse({
      chargeId: chargeData.id as string,
      status: chargeData.status as string,
      qrCode,
      qrCodeText,
      splitApplied: splitResult.splitRules.length > 0,
      platformFeeCents: splitResult.platformFeeCents,
      affiliateCommissionCents: splitResult.affiliateCommissionCents,
      vendorNetCents: splitResult.vendorNetCents,
      hasAffiliate: splitData.hasAffiliate,
      rawResponse: chargeData
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    log.error('Exception', { message: errorMessage });
    await recordPaymentAttempt(supabase, identifier, false);
    return createErrorResponse(errorMessage, 500);
  }
});
