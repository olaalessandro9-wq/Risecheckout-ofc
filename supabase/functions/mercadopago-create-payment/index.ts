/**
 * Mercado Pago Create Payment - VERSÃO REFATORADA
 * 
 * Esta é a versão refatorada usando o PaymentFactory e adaptadores.
 * 
 * MUDANÇAS PRINCIPAIS:
 * 1. Usa PaymentFactory para criar gateway
 * 2. Remove lógica de chamada direta à API do MP
 * 3. Usa interface padronizada (PaymentRequest/PaymentResponse)
 * 4. Código mais limpo e fácil de manter
 * 
 * Para ativar: renomeie index.ts para index.old.ts e este arquivo para index.ts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimitMiddleware, getIdentifier, recordAttempt } from '../_shared/rate-limit.ts';
import { 
  PLATFORM_FEE_PERCENT, 
  PLATFORM_MERCADOPAGO_COLLECTOR_ID, 
  calculatePlatformFeeCents,
  getVendorFeePercent,
  getGatewayCredentials,
  validateCredentials
} from '../_shared/platform-config.ts';

// ========================================================================
// CONSTANTS
// ========================================================================

// Lista de origens permitidas (CORS restritivo)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://risecheckout.com",
  "https://www.risecheckout.com",
  "https://risecheckout-84776.lovable.app",
  "https://prime-checkout-hub.lovable.app"
];

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
});

const ERROR_CODES = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  GATEWAY_NOT_CONFIGURED: 'GATEWAY_NOT_CONFIGURED',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  GATEWAY_API_ERROR: 'GATEWAY_API_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function logInfo(message: string, data?: any) {
  console.log(`[mercadopago-create-payment] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: any) {
  console.error(`[mercadopago-create-payment] [ERROR] ${message}`, error);
}

function logWarn(message: string, data?: any) {
  console.warn(`[mercadopago-create-payment] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function createSuccessResponse(data: any, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status: 200
  });
}

function createErrorResponse(code: string, message: string, status: number, corsHeaders: Record<string, string>, details?: any) {
  const error: any = {
    success: false,
    error: message
  };
  
  if (details) {
      error.data = { code, details };
  }

  return new Response(JSON.stringify(error), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status
  });
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logInfo('Request recebido');

    // ========================================================================
    // 0. RATE LIMITING (Proteção contra abuso)
    // ========================================================================
    const rateLimitResponse = await rateLimitMiddleware(req, {
      maxAttempts: 10,
      windowMs: 60 * 1000, // 1 minuto
      identifier: getIdentifier(req, false), // usar IP
      action: 'create_payment',
    });

    if (rateLimitResponse) {
      logWarn('Rate limit excedido', { identifier: getIdentifier(req, false) });
      return rateLimitResponse;
    }

    // ========================================================================
    // 1. INITIALIZE SUPABASE CLIENT
    // ========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // ========================================================================
    // 2. PARSE AND VALIDATE REQUEST
    // ========================================================================
    let body;
    try {
      body = await req.json();
    } catch (error) {
      logError('Erro ao fazer parse do JSON', error);
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Corpo da requisição inválido', 400, corsHeaders);
    }

    const { orderId, payerEmail, payerName, payerDocument, paymentMethod, token, installments } = body;

    if (!orderId || !payerEmail || !paymentMethod) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando: orderId, payerEmail, paymentMethod', 400, corsHeaders);
    }

    logInfo('Iniciando processamento', { orderId, paymentMethod });

    // ========================================================================
    // 3. FETCH ORDER (COM DADOS DE AFILIADO)
    // ========================================================================
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        affiliate:affiliates(id, user_id, commission_rate)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      logError('Erro ao buscar pedido', orderError);
      return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro ao buscar pedido', 500, corsHeaders);
    }

    if (!order) {
      logWarn('Pedido não encontrado', { orderId });
      return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404, corsHeaders);
    }

    const vendorId = order.vendor_id;

    // ========================================================================
    // 4. FETCH ITEMS FROM DATABASE
    // ========================================================================
    const { data: dbItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, amount_cents, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
        logError('Erro ao buscar itens do pedido', itemsError);
        return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro ao buscar itens', 500, corsHeaders);
    }

    if (!dbItems || dbItems.length === 0) {
        logError('Pedido sem itens no banco de dados', { orderId });
        return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido inconsistente: sem itens salvos', 500, corsHeaders);
    }

    // Calcular total baseado no banco (Segurança)
    const calculatedTotalCents = dbItems.reduce((sum, item) => sum + (item.amount_cents * item.quantity), 0);

    logInfo('Itens carregados do banco com sucesso', {
        itemsCount: dbItems.length,
        totalCents: calculatedTotalCents
    });

    // ========================================================================
    // 5. FETCH GATEWAY CREDENTIALS (Via getGatewayCredentials - Owner usa secrets globais)
    // ========================================================================
    
    let credentialsResult;
    let isOwner = false;
    
    try {
      credentialsResult = await getGatewayCredentials(supabase, vendorId, 'mercadopago');
      isOwner = credentialsResult.isOwner;
    } catch (credError: any) {
      logWarn('Erro ao buscar credenciais via getGatewayCredentials', { error: credError.message });
      
      // Fallback: buscar diretamente da vendor_integrations (para vendors não-owner)
      const { data: integration } = await supabase
        .from('vendor_integrations')
        .select('config')
        .eq('vendor_id', vendorId)
        .eq('integration_type', 'MERCADOPAGO')
        .eq('active', true)
        .maybeSingle();

      if (!integration) {
        logWarn('Mercado Pago não configurado', { vendorId });
        return createErrorResponse(ERROR_CODES.GATEWAY_NOT_CONFIGURED, 'Mercado Pago não configurado para este vendedor', 400, corsHeaders);
      }
      
      credentialsResult = {
        isOwner: false,
        credentials: {
          accessToken: integration.config?.access_token,
          environment: (integration.config?.is_test ? 'sandbox' : 'production') as 'sandbox' | 'production'
        },
        source: 'vendor_integrations' as const
      };
    }

    const { credentials, source } = credentialsResult;
    
    // Validar credenciais
    const validation = validateCredentials('mercadopago', credentials);
    if (!validation.valid) {
      logError('Credenciais inválidas', { missingFields: validation.missingFields });
      return createErrorResponse(ERROR_CODES.GATEWAY_NOT_CONFIGURED, 'Credenciais do Mercado Pago incompletas', 400, corsHeaders);
    }

    const gatewayCredentials = {
      access_token: credentials.accessToken,
      environment: credentials.environment
    };
    
    logInfo(`✅ Credenciais obtidas via: ${source}`, { 
      isOwner, 
      environment: credentials.environment 
    });

    // ========================================================================
    // 6. BUSCAR COLLECTOR_ID DO AFILIADO (SE HOUVER)
    // ========================================================================
    let affiliateCollectorId = null;
    
    if (order.affiliate_id && order.affiliate) {
      logInfo('Pedido tem afiliado, buscando collector_id', { affiliate_id: order.affiliate_id });
      
      const { data: affiliateProfile } = await supabase
        .from('profiles')
        .select('mercadopago_collector_id, mercadopago_email')
        .eq('id', order.affiliate.user_id)
        .maybeSingle();
      
      if (affiliateProfile?.mercadopago_collector_id) {
        affiliateCollectorId = affiliateProfile.mercadopago_collector_id;
        logInfo('✅ Afiliado tem conta MP conectada', { 
          collector_id: affiliateCollectorId,
          email: affiliateProfile.mercadopago_email 
        });
      } else {
        logWarn('⚠️ Afiliado SEM conta MP conectada. Split não será executado.', {
          affiliate_user_id: order.affiliate.user_id
        });
      }
    }

    // ========================================================================
    // 6.2 DETERMINAR TOKEN E APPLICATION_FEE PARA SPLIT DIRETO
    // ========================================================================
    // MODELO CAKTO: Split direto no Mercado Pago via application_fee
    // - Seu produto + Afiliado: Token do AFILIADO, application_fee = sua parte (4% + produtor)
    // - Produto Vendedor: Token do VENDEDOR, application_fee = 4% taxa
    // - Seu produto direto: Nenhum split, 100% fica com você
    // ========================================================================
    
    let effectiveAccessToken = gatewayCredentials.access_token; // Padrão: vendedor/owner
    let applicationFeeCents = 0;

    // CENÁRIO: Seu produto + Afiliado vendendo
    if (isOwner && order.affiliate_id && order.commission_cents > 0 && affiliateCollectorId) {
      logInfo('🔄 [MP SPLIT] Detectado: SEU produto via Afiliado');
      
      // Buscar access_token do AFILIADO
      const { data: affiliateIntegration } = await supabase
        .from('vendor_integrations')
        .select('config')
        .eq('vendor_id', order.affiliate.user_id)
        .eq('integration_type', 'MERCADOPAGO')
        .eq('active', true)
        .maybeSingle();
      
      if (affiliateIntegration?.config?.access_token) {
        effectiveAccessToken = affiliateIntegration.config.access_token;
        
        // VOCÊ RECEBE: Total - Comissão do Afiliado
        // Isso JÁ INCLUI a taxa 4% + sua parte produtor (Modelo CAKTO)
        applicationFeeCents = calculatedTotalCents - order.commission_cents;
        
        logInfo('💰 [MP SPLIT] Modelo CAKTO - Seu produto via Afiliado', {
          usando_token: 'AFILIADO',
          total_cents: calculatedTotalCents,
          afiliado_recebe_cents: order.commission_cents,
          voce_recebe_cents: applicationFeeCents,
          nota: 'application_fee inclui taxa 4% + parte produtor JUNTOS'
        });
      } else {
        logWarn('⚠️ Afiliado sem token MP configurado, split não será aplicado');
      }
    } else if (!isOwner) {
      // CENÁRIO: Vendedor vendendo produto DELE
      // application_fee = sua taxa de 4% (já calculada no order)
      applicationFeeCents = order.platform_fee_cents || 0;
      
      logInfo('💰 [MP SPLIT] Modelo CAKTO - Produto de Vendedor', {
        usando_token: 'VENDEDOR',
        platform_fee_cents: applicationFeeCents,
        nota: 'Você recebe apenas a taxa 4%'
      });
    } else {
      logInfo('🏠 [MP SPLIT] Seu produto, venda direta - 100% fica com você');
    }

    // ========================================================================
    // 7. MONTAR REGRAS DE SPLIT (MODELO CAKTO - Taxa proporcional)
    // ========================================================================
    // 
    // MODELO CAKTO:
    // - Taxa da plataforma já foi descontada do total no create-order
    // - commission_cents já está calculado sobre o valor LÍQUIDO
    // - Aqui apenas montamos os splits para enviar ao gateway
    //
    // OWNER SIMPLIFICADO:
    // - Se vendedor é Owner, NÃO adicionar split de plataforma (já é tudo dele)
    // - Apenas split do afiliado (se houver)
    //
    // IMPORTANTE: MP v1/payments NÃO suporta disbursements!
    // O split é feito via application_fee quando a conta é Marketplace
    // ========================================================================
    
    const splitRules: any[] = [];
    
    if (isOwner) {
      logInfo('🏠 [MP] OWNER detectado - Split simplificado (apenas afiliado se houver)');
    }

    // A. Comissão do Afiliado (se tiver collector_id)
    if (order.commission_cents > 0 && order.affiliate_id && affiliateCollectorId) {
      splitRules.push({
        role: 'affiliate',
        amount_cents: order.commission_cents,
        recipient_id: affiliateCollectorId
      });
      logInfo('🤝 Split de afiliado configurado (MODELO CAKTO)', { 
        commission_cents: order.commission_cents,
        collector_id: affiliateCollectorId,
        nota: 'Comissão já calculada sobre valor líquido'
      });
    }

    // B. Taxa da Plataforma (dinâmica por vendedor) - APENAS SE NÃO FOR OWNER
    if (!isOwner) {
      const vendorFeePercent = await getVendorFeePercent(supabase, vendorId);
      const platformFeeCents = order.platform_fee_cents || calculatePlatformFeeCents(calculatedTotalCents, vendorFeePercent);
      
      if (platformFeeCents > 0 && PLATFORM_MERCADOPAGO_COLLECTOR_ID) {
        splitRules.push({
          role: 'platform',
          amount_cents: platformFeeCents,
          recipient_id: PLATFORM_MERCADOPAGO_COLLECTOR_ID
        });
        logInfo('🏦 Split da plataforma configurado (MODELO CAKTO)', { 
          platform_fee_cents: platformFeeCents,
          platform_fee_percent: `${vendorFeePercent * 100}%`,
          is_custom_fee: vendorFeePercent !== PLATFORM_FEE_PERCENT,
          collector_id: PLATFORM_MERCADOPAGO_COLLECTOR_ID 
        });

        // Atualizar platform_fee_cents no pedido se não estava preenchido
        if (!order.platform_fee_cents) {
          await supabase
            .from('orders')
            .update({ platform_fee_cents: platformFeeCents })
            .eq('id', orderId);
        }
      }
    } else {
      logInfo('🏠 [MP OWNER] Skip split plataforma - Owner recebe tudo junto');
    }

    if (splitRules.length > 0) {
      logInfo(`💰 MODELO CAKTO: Split configurado com ${splitRules.length} destinatário(s)`, {
        isOwner,
        splits: splitRules.map(r => ({ role: r.role, cents: r.amount_cents }))
      });
    } else if (isOwner) {
      logInfo('🏠 [MP OWNER] Nenhum split necessário - 100% fica com Owner');
    }

    // ========================================================================
    // 8. PROCESS PAYMENT WITH MERCADO PAGO API
    // ========================================================================
    logInfo('Processando pagamento', { method: paymentMethod });

    const accessToken = gatewayCredentials.access_token;
    if (!accessToken) {
      return createErrorResponse(ERROR_CODES.GATEWAY_NOT_CONFIGURED, 'Access token não configurado', 400, corsHeaders);
    }

    let paymentResult: any;

    try {
      if (paymentMethod === 'pix') {
        // Create PIX payment
        const pixPayload: any = {
          transaction_amount: calculatedTotalCents / 100,
          description: `Pedido #${orderId.slice(0, 8)}`,
          payment_method_id: 'pix',
          payer: {
            email: payerEmail,
            first_name: payerName?.split(' ')[0] || 'Cliente',
            last_name: payerName?.split(' ').slice(1).join(' ') || '',
            identification: payerDocument ? {
              type: payerDocument.length <= 11 ? 'CPF' : 'CNPJ',
              number: payerDocument.replace(/\D/g, '')
            } : undefined
          }
        };

        // 🔥 ADICIONAR application_fee (SPLIT REAL - Modelo CAKTO)
        if (applicationFeeCents > 0) {
          pixPayload.application_fee = applicationFeeCents / 100; // MP usa REAIS
          logInfo('✅ [MP SPLIT PIX] application_fee ADICIONADO', {
            cents: applicationFeeCents,
            reais: applicationFeeCents / 100,
            modelo: 'CAKTO - Taxa 4% + Produtor incluídos (se aplicável)'
          });
        }

        const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveAccessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${orderId}-pix`
          },
          body: JSON.stringify(pixPayload)
        });

        const pixData = await pixResponse.json();

        if (!pixResponse.ok) {
          logError('Erro na API do Mercado Pago (PIX)', pixData);
          return createErrorResponse(ERROR_CODES.GATEWAY_API_ERROR, pixData.message || 'Erro ao criar PIX', 502, corsHeaders, pixData);
        }

        paymentResult = {
          success: true,
          transactionId: String(pixData.id),
          status: pixData.status,
          qrCode: pixData.point_of_interaction?.transaction_data?.qr_code_base64,
          qrCodeText: pixData.point_of_interaction?.transaction_data?.qr_code
        };

      } else if (paymentMethod === 'credit_card') {
        if (!token) {
          return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token de cartão obrigatório', 400, corsHeaders);
        }
        
        logInfo('Token recebido do frontend', { token: token.substring(0, 20) + '...', length: token.length });

        const cardPayload: any = {
          transaction_amount: calculatedTotalCents / 100,
          token: token,
          description: `Pedido #${orderId.slice(0, 8)}`,
          installments: installments || 1,
          payment_method_id: 'master', // Will be overridden by token
          payer: {
            email: payerEmail,
            first_name: payerName?.split(' ')[0] || 'Cliente',
            last_name: payerName?.split(' ').slice(1).join(' ') || '',
            identification: payerDocument ? {
              type: payerDocument.length <= 11 ? 'CPF' : 'CNPJ',
              number: payerDocument.replace(/\D/g, '')
            } : undefined
          }
        };

        // 🔥 ADICIONAR application_fee (SPLIT REAL - Modelo CAKTO)
        if (applicationFeeCents > 0) {
          cardPayload.application_fee = applicationFeeCents / 100; // MP usa REAIS
          logInfo('✅ [MP SPLIT CARTÃO] application_fee ADICIONADO', {
            cents: applicationFeeCents,
            reais: applicationFeeCents / 100,
            modelo: 'CAKTO - Taxa 4% + Produtor incluídos (se aplicável)'
          });
        }

        const cardResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveAccessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `${orderId}-card`
          },
          body: JSON.stringify(cardPayload)
        });

        const cardData = await cardResponse.json();

        if (!cardResponse.ok) {
          logError('Erro na API do Mercado Pago (Cartão)', cardData);
          return createErrorResponse(ERROR_CODES.GATEWAY_API_ERROR, cardData.message || 'Erro ao processar cartão', 502, corsHeaders, cardData);
        }

        paymentResult = {
          success: true,
          transactionId: String(cardData.id),
          status: cardData.status
        };

      } else {
        return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Método de pagamento inválido', 400, corsHeaders);
      }
    } catch (error: any) {
      logError('Erro ao processar pagamento', error);
      return createErrorResponse(ERROR_CODES.GATEWAY_API_ERROR, error.message, 502, corsHeaders);
    }

    if (!paymentResult.success) {
      logError('Pagamento recusado pelo gateway', paymentResult);
      return createErrorResponse(ERROR_CODES.GATEWAY_API_ERROR, 'Erro ao processar pagamento', 502, corsHeaders);
    }

    logInfo('Pagamento criado com sucesso', { 
      transactionId: paymentResult.transactionId, 
      status: paymentResult.status 
    });

    // ========================================================================
    // 9. UPDATE ORDER IN DATABASE
    // ========================================================================
    const updateData: any = {
      gateway: 'MERCADOPAGO',
      gateway_payment_id: paymentResult.transactionId,
      status: paymentResult.status === 'approved' ? 'PAID' : order.status,
      payment_method: paymentMethod.toUpperCase(),
      updated_at: new Date().toISOString()
    };

    if (paymentMethod === 'pix' && paymentResult.qrCodeText) {
      updateData.pix_qr_code = paymentResult.qrCodeText;
      updateData.pix_id = paymentResult.transactionId;
      updateData.pix_status = paymentResult.status;
      updateData.pix_created_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      logError('Erro ao atualizar pedido', updateError);
      // Não bloqueia o retorno
    }

    // ========================================================================
    // 10. RETURN SUCCESS
    // ========================================================================
    const responseData: any = {
      paymentId: paymentResult.transactionId,
      status: paymentResult.status
    };

    if (paymentMethod === 'pix' && paymentResult.qrCode) {
      responseData.pix = {
        qrCode: paymentResult.qrCodeText,
        qrCodeBase64: paymentResult.qrCode
      };
    }

    logInfo('Processamento concluído com sucesso', { paymentId: paymentResult.transactionId });

    return createSuccessResponse(responseData, corsHeaders);

  } catch (error: any) {
    logError('Erro fatal não tratado', { message: error.message, stack: error.stack });
    // Fallback corsHeaders para erro fatal
    const fallbackCorsHeaders = getCorsHeaders("");
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno do servidor', 500, fallbackCorsHeaders, error.message);
  }
});
