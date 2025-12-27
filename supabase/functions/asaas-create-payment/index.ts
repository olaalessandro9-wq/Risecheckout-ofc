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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Módulos compartilhados
import { 
  calculatePlatformFeeCents,
  PLATFORM_FEE_PERCENT,
  getGatewayCredentials,
  validateCredentials
} from "../_shared/platform-config.ts";
import { findOrCreateCustomer, CustomerData } from "../_shared/asaas-customer.ts";
import { calculateMarketplaceSplitData } from "../_shared/asaas-split-calculator.ts";
import { checkRateLimit, recordAttempt, getIdentifier } from "../_shared/rate-limit.ts";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Configuração de rate limiting
const RATE_LIMIT_CONFIG = {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minuto
  action: 'asaas_create_payment'
};

interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

interface PaymentRequest {
  vendorId?: string; // Agora opcional - será buscado da order se não fornecido
  orderId: string;
  amountCents: number;
  paymentMethod: 'pix' | 'credit_card';
  customer: CustomerData;
  description?: string;
  cardToken?: string;
  installments?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ==========================================
  // RATE LIMITING
  // ==========================================
  const identifier = getIdentifier(req);
  const rateLimitResult = await checkRateLimit(supabase, {
    ...RATE_LIMIT_CONFIG,
    identifier
  });

  if (!rateLimitResult.allowed) {
    console.warn('[asaas-create-payment] Rate limit exceeded:', identifier);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }

  try {
    const payload: PaymentRequest = await req.json();
    
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] 🏪 MODELO MARKETPLACE ASAAS');
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] Payload:', JSON.stringify({
      orderId: payload.orderId,
      vendorId: payload.vendorId,
      amountCents: payload.amountCents,
      paymentMethod: payload.paymentMethod,
      hasCardToken: !!payload.cardToken
    }, null, 2));

    const { orderId, amountCents, paymentMethod, customer, description, cardToken, installments } = payload;
    let { vendorId } = payload; // vendorId agora é opcional

    // Validações básicas (sem vendorId - será buscado da order)
    if (!orderId || !amountCents || !customer) {
      await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios: orderId, amountCents, customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentMethod === 'credit_card' && !cardToken) {
      await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
      return new Response(
        JSON.stringify({ success: false, error: 'cardToken é obrigatório para pagamento com cartão' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // BUSCAR VENDOR_ID DA ORDER (se não fornecido)
    // ==========================================
    if (!vendorId) {
      console.log('[asaas-create-payment] vendorId não fornecido, buscando da order...');
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('vendor_id')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError || !orderData) {
        console.error('[asaas-create-payment] Erro ao buscar order:', orderError);
        await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
        return new Response(
          JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      vendorId = orderData.vendor_id;
      console.log('[asaas-create-payment] ✅ vendorId obtido da order:', vendorId);
    }

    // Garantir que vendorId existe neste ponto
    const resolvedVendorId: string = vendorId!;

    // ==========================================
    // 1. BUSCAR CREDENCIAIS DINAMICAMENTE
    // ==========================================
    const { credentials, isOwner: isCredentialsOwner } = await getGatewayCredentials(supabase, resolvedVendorId, 'asaas');

    const validation = validateCredentials('asaas', credentials);
    if (!validation.valid) {
      console.error('[asaas-create-payment] ❌ Credenciais inválidas:', validation.missingFields);
      await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Credenciais Asaas faltando: ${validation.missingFields.join(', ')}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = credentials.environment === 'sandbox'
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    const PLATFORM_API_KEY = credentials.apiKey!;

    console.log(`[asaas-create-payment] 🔑 Credenciais: ${isCredentialsOwner ? 'Owner' : 'Vendor'}`);
    console.log(`[asaas-create-payment] 🌐 Ambiente: ${credentials.environment.toUpperCase()}`);

    // ==========================================
    // 2. CALCULAR SPLIT (módulo externo)
    // ==========================================
    const splitData = await calculateMarketplaceSplitData(supabase, orderId, resolvedVendorId);
    
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] SPLIT CALCULADO:');
    console.log(`[asaas-create-payment] - É Owner: ${splitData.isOwner}`);
    console.log(`[asaas-create-payment] - Tem Afiliado: ${splitData.hasAffiliate}`);
    console.log(`[asaas-create-payment] - Affiliate Wallet: ${splitData.affiliateWalletId || 'N/A'}`);
    console.log(`[asaas-create-payment] - Affiliate %: ${splitData.affiliateCommissionPercent}%`);
    console.log('[asaas-create-payment] ========================================');

    // ==========================================
    // 3. CRIAR CUSTOMER (módulo externo)
    // ==========================================
    const asaasCustomer = await findOrCreateCustomer(baseUrl, PLATFORM_API_KEY, customer);
    if (!asaasCustomer) {
      await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar/buscar cliente no Asaas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. MONTAR SPLIT RULES
    // ==========================================
    const splitRules: AsaasSplitRule[] = [];
    let platformFeeCents = 0;
    let affiliateCommissionCents = 0;
    let vendorNetCents = amountCents;
    
    if (splitData.isOwner) {
      if (splitData.hasAffiliate && splitData.affiliateWalletId && splitData.affiliateCommissionPercent > 0) {
        const adjustedAffiliatePercent = splitData.affiliateCommissionPercent * (1 - PLATFORM_FEE_PERCENT);
        
        splitRules.push({
          walletId: splitData.affiliateWalletId,
          percentualValue: adjustedAffiliatePercent
        });
        
        platformFeeCents = calculatePlatformFeeCents(amountCents);
        const netAfterFee = amountCents - platformFeeCents;
        affiliateCommissionCents = Math.floor(netAfterFee * (splitData.affiliateCommissionPercent / 100));
        vendorNetCents = netAfterFee - affiliateCommissionCents;
        
        console.log(`[asaas-create-payment] 🏠 OWNER + AFILIADO: Split ${adjustedAffiliatePercent.toFixed(2)}%`);
        
      } else if (splitData.hasAffiliate && !splitData.affiliateWalletId) {
        console.warn(`[asaas-create-payment] ⚠️ Afiliado sem wallet! Venda sem split.`);
      } else {
        console.log(`[asaas-create-payment] 🏠 OWNER DIRETO: 100% RiseCheckout`);
      }
      
    } else {
      if (!splitData.vendorWalletId) {
        console.error(`[asaas-create-payment] ❌ Vendedor sem asaas_wallet_id!`);
        await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Configure seu Wallet ID Asaas em Configurações > Financeiro' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      splitRules.push({
        walletId: splitData.vendorWalletId,
        percentualValue: 96
      });
      
      platformFeeCents = calculatePlatformFeeCents(amountCents);
      vendorNetCents = amountCents - platformFeeCents;
      
      console.log(`[asaas-create-payment] 👤 VENDEDOR: 96% → ${splitData.vendorWalletId.substring(0, 15)}...`);
    }

    // ==========================================
    // 5. CRIAR COBRANÇA
    // ==========================================
    const billingType = paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD';
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const chargePayload: Record<string, unknown> = {
      customer: asaasCustomer.id,
      billingType,
      value: amountCents / 100,
      dueDate: dueDate.toISOString().split('T')[0],
      externalReference: orderId,
      description: description || `Pedido ${orderId}`
    };

    if (splitRules.length > 0) {
      chargePayload.split = splitRules;
      console.log(`[asaas-create-payment] 📦 Split: ${JSON.stringify(splitRules)}`);
    }

    if (paymentMethod === 'credit_card') {
      chargePayload.installmentCount = installments || 1;
      try {
        const cardData = JSON.parse(cardToken!);
        if (cardData.creditCardToken) {
          chargePayload.creditCardToken = cardData.creditCardToken;
        } else {
          chargePayload.creditCard = cardData.creditCard;
          chargePayload.creditCardHolderInfo = cardData.creditCardHolderInfo;
        }
      } catch {
        chargePayload.creditCardToken = cardToken;
      }
    }

    console.log('[asaas-create-payment] Criando cobrança...');

    const chargeResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': PLATFORM_API_KEY
      },
      body: JSON.stringify(chargePayload)
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok) {
      console.error('[asaas-create-payment] Erro:', chargeData);
      await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
      
      const errorMsg = chargeData.errors?.[0]?.description || chargeData.message || 'Erro ao criar cobrança';
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[asaas-create-payment] ✅ Cobrança criada:', chargeData.id);

    // ==========================================
    // 6. ATUALIZAR ORDEM
    // ==========================================
    await supabase
      .from('orders')
      .update({
        platform_fee_cents: platformFeeCents,
        commission_cents: affiliateCommissionCents,
        gateway_payment_id: chargeData.id
      })
      .eq('id', orderId);

    // ==========================================
    // 7. SE PIX, OBTER QR CODE
    // ==========================================
    let qrCode: string | undefined;
    let qrCodeText: string | undefined;

    if (paymentMethod === 'pix') {
      const qrResponse = await fetch(`${baseUrl}/payments/${chargeData.id}/pixQrCode`, {
        headers: {
          'Content-Type': 'application/json',
          'access_token': PLATFORM_API_KEY
        }
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCode = qrData.encodedImage;
        qrCodeText = qrData.payload;
        console.log('[asaas-create-payment] QR Code obtido');
      }
    }

    // ==========================================
    // 8. REGISTRAR SUCESSO E AUDIT LOG
    // ==========================================
    await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, true);
    
    // Audit log para rastreabilidade
    await logSecurityEvent(supabase, {
      userId: resolvedVendorId,
      action: SecurityAction.PROCESS_PAYMENT,
      resource: 'orders',
      resourceId: orderId,
      success: true,
      request: req,
      metadata: {
        gateway: 'asaas',
        paymentMethod,
        amountCents,
        paymentId: chargeData.id,
        hasAffiliate: splitData.hasAffiliate,
        platformFeeCents,
        affiliateCommissionCents
      }
    });

    // ==========================================
    // 9. RESPOSTA
    // ==========================================
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'RECEIVED': 'approved',
      'CONFIRMED': 'approved',
      'OVERDUE': 'expired',
      'REFUNDED': 'refunded',
      'RECEIVED_IN_CASH': 'approved'
    };

    const response = {
      success: true,
      transactionId: chargeData.id,
      status: statusMap[chargeData.status] || 'pending',
      qrCode,
      qrCodeText,
      splitApplied: splitRules.length > 0,
      splitDetails: {
        platformFeeCents,
        affiliateCommissionCents,
        vendorNetCents,
        hasAffiliate: splitData.hasAffiliate
      },
      rawResponse: chargeData
    };

    console.log('[asaas-create-payment] ✅ Sucesso');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[asaas-create-payment] Exception:', error);
    await recordAttempt(supabase, { ...RATE_LIMIT_CONFIG, identifier }, false);
    
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
