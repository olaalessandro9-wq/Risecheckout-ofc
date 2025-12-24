import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  isVendorOwner,
  calculatePlatformFeeCents,
  PLATFORM_FEE_PERCENT,
  getGatewayCredentials,
  validateCredentials
} from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface CustomerData {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

/**
 * ============================================================================
 * MODELO MARKETPLACE ASAAS - RiseCheckout
 * ============================================================================
 * 
 * TODAS as cobranças são feitas na conta RiseCheckout (ASAAS_API_KEY).
 * O split é SEMPRE BINÁRIO (nunca 3 partes):
 * 
 * 1. OWNER vendendo DIRETO: splitRules = [] → 100% fica com RiseCheckout
 * 
 * 2. OWNER + AFILIADO: splitRules = [{ walletId: afiliado, percentualValue: X% * 0.96 }]
 *    - Desconta 4% da plataforma PRIMEIRO
 *    - Afiliado recebe sua % sobre o líquido
 *    - RiseCheckout recebe 4% + resto (em um único recebimento)
 * 
 * 3. VENDEDOR COMUM: splitRules = [{ walletId: vendedor, percentualValue: 96 }]
 *    - Vendedor recebe 96%
 *    - RiseCheckout recebe 4% automaticamente
 * 
 * IMPORTANTE: Vendedores NÃO têm afiliados (só Owner pode ter).
 * ============================================================================
 */
interface PaymentRequest {
  vendorId: string;
  orderId: string;
  amountCents: number;
  paymentMethod: 'pix' | 'credit_card';
  customer: CustomerData;
  description?: string;
  cardToken?: string;
  installments?: number;
}

interface AsaasSplitRule {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

/**
 * Dados de split calculados internamente
 */
interface CalculatedSplitData {
  isOwner: boolean;
  hasAffiliate: boolean;
  affiliateId: string | null;
  affiliateUserId: string | null;
  affiliateWalletId: string | null;
  affiliateCommissionPercent: number;
  vendorWalletId: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PaymentRequest = await req.json();
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] 🏪 MODELO MARKETPLACE ASAAS');
    console.log('[asaas-create-payment] Todas cobranças no nome RiseCheckout');
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] Payload:', JSON.stringify({
      orderId: payload.orderId,
      vendorId: payload.vendorId,
      amountCents: payload.amountCents,
      paymentMethod: payload.paymentMethod,
      hasCardToken: !!payload.cardToken
    }, null, 2));

    const { vendorId, orderId, amountCents, paymentMethod, customer, description, cardToken, installments } = payload;

    // Validações básicas
    if (!vendorId || !orderId || !amountCents || !customer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios: vendorId, orderId, amountCents, customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (paymentMethod === 'credit_card' && !cardToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'cardToken é obrigatório para pagamento com cartão' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ==========================================
    // 1. BUSCAR CREDENCIAIS DINAMICAMENTE (platform-config)
    // ==========================================
    const { credentials, isOwner: isCredentialsOwner } = await getGatewayCredentials(supabase, vendorId, 'asaas');

    // Validar credenciais
    const validation = validateCredentials('asaas', credentials);
    if (!validation.valid) {
      console.error('[asaas-create-payment] ❌ Credenciais inválidas:', validation.missingFields);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Credenciais Asaas faltando: ${validation.missingFields.join(', ')}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL baseada no ambiente (DINÂMICO!)
    const baseUrl = credentials.environment === 'sandbox'
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/v3';

    const PLATFORM_API_KEY = credentials.apiKey!;

    console.log(`[asaas-create-payment] 🔑 Usando credenciais: ${isCredentialsOwner ? 'Owner (secrets)' : 'Vendor (integrations)'}`);
    console.log(`[asaas-create-payment] 🌐 Ambiente: ${credentials.environment.toUpperCase()}`);

    // ==========================================
    // 2. CALCULAR SPLIT
    // ==========================================
    const splitData = await calculateMarketplaceSplitData(supabase, orderId, vendorId);
    
    console.log('[asaas-create-payment] ========================================');
    console.log('[asaas-create-payment] SPLIT CALCULADO:');
    console.log(`[asaas-create-payment] - É Owner: ${splitData.isOwner}`);
    console.log(`[asaas-create-payment] - Tem Afiliado: ${splitData.hasAffiliate}`);
    console.log(`[asaas-create-payment] - Affiliate Wallet: ${splitData.affiliateWalletId || 'N/A'}`);
    console.log(`[asaas-create-payment] - Affiliate %: ${splitData.affiliateCommissionPercent}%`);
    console.log(`[asaas-create-payment] - Vendor Wallet: ${splitData.vendorWalletId || 'N/A'}`);
    console.log('[asaas-create-payment] ========================================');

    // ==========================================
    // 3. CRIAR CUSTOMER NO ASAAS
    // ==========================================
    const asaasCustomer = await findOrCreateCustomer(baseUrl, PLATFORM_API_KEY, customer);
    if (!asaasCustomer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar/buscar cliente no Asaas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // 4. MONTAR SPLIT RULES (MODELO BINÁRIO)
    // ==========================================
    const splitRules: AsaasSplitRule[] = [];
    let platformFeeCents = 0;
    let affiliateCommissionCents = 0;
    let vendorNetCents = amountCents;
    
    if (splitData.isOwner) {
      // OWNER vendendo
      if (splitData.hasAffiliate && splitData.affiliateWalletId && splitData.affiliateCommissionPercent > 0) {
        // OWNER + AFILIADO: Split ajustado
        // Afiliado recebe (comissão% * 0.96) do total
        // Exemplo: 50% comissão → 48% split → Owner recebe 52% (4% + 48%)
        const adjustedAffiliatePercent = splitData.affiliateCommissionPercent * (1 - PLATFORM_FEE_PERCENT);
        
        splitRules.push({
          walletId: splitData.affiliateWalletId,
          percentualValue: adjustedAffiliatePercent
        });
        
        platformFeeCents = calculatePlatformFeeCents(amountCents);
        const netAfterFee = amountCents - platformFeeCents;
        affiliateCommissionCents = Math.floor(netAfterFee * (splitData.affiliateCommissionPercent / 100));
        vendorNetCents = netAfterFee - affiliateCommissionCents;
        
        console.log(`[asaas-create-payment] 🏠 OWNER + AFILIADO:`);
        console.log(`[asaas-create-payment]   Split ${adjustedAffiliatePercent.toFixed(2)}% → afiliado`);
        console.log(`[asaas-create-payment]   Owner recebe ${(100 - adjustedAffiliatePercent).toFixed(2)}%`);
        
      } else if (splitData.hasAffiliate && !splitData.affiliateWalletId) {
        console.warn(`[asaas-create-payment] ⚠️ Afiliado sem wallet! Venda sem split.`);
      } else {
        console.log(`[asaas-create-payment] 🏠 OWNER DIRETO: 100% RiseCheckout`);
      }
      
    } else {
      // VENDEDOR COMUM
      if (!splitData.vendorWalletId) {
        console.error(`[asaas-create-payment] ❌ Vendedor sem asaas_wallet_id!`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Configure seu Wallet ID Asaas em Configurações > Financeiro' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 96% para vendedor, 4% fica com RiseCheckout
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
    // 8. RESPOSTA
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
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==========================================
// HELPER: Calcular dados de split para Marketplace
// ==========================================
async function calculateMarketplaceSplitData(
  supabase: any,
  orderId: string,
  vendorId: string
): Promise<CalculatedSplitData> {
  console.log('[calculateMarketplaceSplit] orderId:', orderId, 'vendorId:', vendorId);
  
  const result: CalculatedSplitData = {
    isOwner: false,
    hasAffiliate: false,
    affiliateId: null,
    affiliateUserId: null,
    affiliateWalletId: null,
    affiliateCommissionPercent: 0,
    vendorWalletId: null
  };

  // 1. Verificar se é Owner
  result.isOwner = await isVendorOwner(supabase, vendorId);
  console.log('[calculateMarketplaceSplit] isOwner:', result.isOwner);

  // 2. Buscar ordem para verificar afiliado
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('affiliate_id')
    .eq('id', orderId)
    .single();
  
  if (orderError) {
    console.error('[calculateMarketplaceSplit] Erro ao buscar ordem:', orderError);
    return result;
  }

  // 3. Se tem afiliado, buscar dados
  if (orderData?.affiliate_id) {
    result.hasAffiliate = true;
    result.affiliateId = orderData.affiliate_id;
    
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('user_id, commission_rate')
      .eq('id', orderData.affiliate_id)
      .single();
    
    if (affiliateData) {
      result.affiliateUserId = affiliateData.user_id;
      result.affiliateCommissionPercent = affiliateData.commission_rate || 0;
      
      // Wallet do afiliado: buscar direto em profiles (fonte única de verdade)
      if (affiliateData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('asaas_wallet_id')
          .eq('id', affiliateData.user_id)
          .single();
        
        if (profileData?.asaas_wallet_id) {
          result.affiliateWalletId = profileData.asaas_wallet_id;
        }
      }
      
      console.log('[calculateMarketplaceSplit] Afiliado:', {
        id: result.affiliateId,
        userId: result.affiliateUserId,
        walletId: result.affiliateWalletId,
        commission: result.affiliateCommissionPercent
      });
    }
  }

  // 4. Se NÃO é Owner, buscar wallet do vendedor
  if (!result.isOwner) {
    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('asaas_wallet_id')
      .eq('id', vendorId)
      .single();
    
    result.vendorWalletId = vendorProfile?.asaas_wallet_id || null;
    console.log('[calculateMarketplaceSplit] Vendor wallet:', result.vendorWalletId);
  }

  return result;
}

// ==========================================
// HELPER: Buscar ou criar customer
// ==========================================
async function findOrCreateCustomer(
  baseUrl: string, 
  apiKey: string, 
  customer: CustomerData
): Promise<{ id: string } | null> {
  const document = customer.document.replace(/\D/g, '');

  // Tentar buscar por CPF/CNPJ
  if (document) {
    const searchResponse = await fetch(`${baseUrl}/customers?cpfCnpj=${document}`, {
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.data?.[0]) {
        console.log('[asaas] Customer encontrado:', searchData.data[0].id);
        return { id: searchData.data[0].id };
      }
    }
  }

  // Criar novo customer
  const createResponse = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      cpfCnpj: document,
      phone: customer.phone?.replace(/\D/g, ''),
      notificationDisabled: false
    })
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    console.error('[asaas] Erro ao criar customer:', errorData);
    return null;
  }

  const newCustomer = await createResponse.json();
  console.log('[asaas] Customer criado:', newCustomer.id);
  return { id: newCustomer.id };
}
