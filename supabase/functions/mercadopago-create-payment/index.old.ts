import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ========================================================================
// CONSTANTS
// ========================================================================
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const ERROR_CODES = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  MP_NOT_CONFIGURED: 'MP_NOT_CONFIGURED',
  TOKEN_REQUIRED: 'TOKEN_REQUIRED',
  MP_API_ERROR: 'MP_API_ERROR',
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

function createSuccessResponse(data: any) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    },
    status: 200
  });
}

function createErrorResponse(code: string, message: string, status: number, details?: any) {
  const error: any = {
    success: false,
    error: message
  };
  
  if (details) {
      error.data = { code, details };
  }

  return new Response(JSON.stringify(error), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    },
    status
  });
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    logInfo('Request recebido');

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
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Corpo da requisição inválido', 400);
    }

    const { orderId, payerEmail, payerName, payerDocument, paymentMethod, token, installments } = body;
    // Note: Ignoramos o campo 'items' do body propositalmente para evitar sobrescrita

    if (!orderId || !payerEmail || !paymentMethod) {
      return createErrorResponse(ERROR_CODES.INVALID_REQUEST, 'Campos obrigatórios faltando: orderId, payerEmail, paymentMethod', 400);
    }

    logInfo('Iniciando processamento', { orderId, paymentMethod });

    // ========================================================================
    // 3. FETCH ORDER
    // ========================================================================
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      logError('Erro ao buscar pedido', orderError);
      return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro ao buscar pedido', 500);
    }

    if (!order) {
      logWarn('Pedido não encontrado', { orderId });
      return createErrorResponse(ERROR_CODES.ORDER_NOT_FOUND, 'Pedido não encontrado', 404);
    }

    const vendorId = order.vendor_id;

    // ========================================================================
    // 4. FETCH ITEMS FROM DATABASE (SINGLE SOURCE OF TRUTH)
    // ========================================================================
    // Buscamos os itens que a função create-order acabou de salvar.
    // Essa é a única fonte confiável.
    
    const { data: dbItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, amount_cents, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
        logError('Erro ao buscar itens do pedido', itemsError);
        return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro ao buscar itens', 500);
    }

    if (!dbItems || dbItems.length === 0) {
        logError('Pedido sem itens no banco de dados', { orderId });
        return createErrorResponse(ERROR_CODES.PRODUCTS_NOT_FOUND, 'Pedido inconsistente: sem itens salvos', 500);
    }

    // Calcular total baseado no banco (Segurança)
    const calculatedTotalCents = dbItems.reduce((sum, item) => sum + (item.amount_cents * item.quantity), 0);
    const finalAmount = calculatedTotalCents / 100;

    // Preparar lista de itens para o Mercado Pago (Metadados)
    const finalItemsList = dbItems.map((item) => ({
        id: item.product_id,
        title: item.product_name,
        description: item.product_name,
        quantity: item.quantity,
        unit_price: item.amount_cents / 100,
        category_id: 'digital_goods'
    }));

    logInfo('Itens carregados do banco com sucesso', {
        itemsCount: finalItemsList.length,
        totalAmount: finalAmount
    });

    // ========================================================================
    // 5. FETCH MERCADO PAGO CREDENTIALS
    // ========================================================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('test_mode_enabled, test_public_key, test_access_token')
      .eq('id', vendorId)
      .maybeSingle();

    const testModeEnabled = profile?.test_mode_enabled || false;
    let accessToken;

    if (testModeEnabled && profile?.test_access_token) {
      accessToken = profile.test_access_token;
      logInfo('Usando credenciais de teste');
    } else {
      const { data: integration } = await supabase
        .from('vendor_integrations')
        .select('config')
        .eq('vendor_id', vendorId)
        .eq('integration_type', 'MERCADOPAGO')
        .eq('active', true)
        .maybeSingle();

      if (!integration) {
        logWarn('Mercado Pago não configurado', { vendorId });
        return createErrorResponse(ERROR_CODES.MP_NOT_CONFIGURED, 'Mercado Pago não configurado para este vendedor', 400);
      }
      accessToken = integration.config.access_token;
      logInfo('Usando credenciais de produção');
    }

    // ========================================================================
    // 6. PREPARE PAYMENT DATA
    // ========================================================================
    const paymentData: any = {
      transaction_amount: finalAmount,
      description: `Pedido #${orderId.slice(0, 8)}`,
      payment_method_id: paymentMethod === 'pix' ? 'pix' : 'credit_card',
      payer: {
        email: payerEmail,
        ...payerName && {
          first_name: payerName.split(' ')[0],
          last_name: payerName.split(' ').slice(1).join(' ') || undefined
        },
        ...payerDocument && {
          identification: {
            type: payerDocument.length === 11 ? 'CPF' : 'CNPJ',
            number: payerDocument
          }
        }
      },
      external_reference: orderId,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      additional_info: {
        items: finalItemsList
      }
    };

    if (paymentMethod === 'credit_card') {
      if (!token) {
        return createErrorResponse(ERROR_CODES.TOKEN_REQUIRED, 'Token de cartão obrigatório', 400);
      }
      paymentData.token = token;
      paymentData.installments = installments || 1;
      paymentData.statement_descriptor = 'RISECHECKOUT';
      delete paymentData.payment_method_id;
    }

    // ========================================================================
    // 7. PROCESS PAYMENT WITH MERCADO PAGO
    // ========================================================================
    logInfo('Enviando pagamento para Mercado Pago', { amount: finalAmount, method: paymentMethod });

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      logError('Erro na API do Mercado Pago', { status: mpResponse.status, data: mpData });
      return createErrorResponse(ERROR_CODES.MP_API_ERROR, mpData.message || 'Erro ao processar pagamento', 502, JSON.stringify(mpData));
    }

    logInfo('Pagamento criado com sucesso', { paymentId: mpData.id, status: mpData.status });

    // ========================================================================
    // 8. UPDATE ORDER IN DATABASE
    // ========================================================================
    const updateData: any = {
      gateway: 'MERCADOPAGO',
      gateway_payment_id: mpData.id.toString(),
      status: mpData.status === 'approved' ? 'PAID' : order.status,
      payment_method: paymentMethod.toUpperCase(),
      updated_at: new Date().toISOString()
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction) {
      updateData.pix_qr_code = mpData.point_of_interaction.transaction_data.qr_code;
      updateData.pix_id = mpData.id.toString();
      updateData.pix_status = mpData.status;
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
    // 9. RETURN SUCCESS
    // ========================================================================
    const responseData: any = {
      paymentId: mpData.id,
      status: mpData.status,
      statusDetail: mpData.status_detail
    };

    if (paymentMethod === 'pix' && mpData.point_of_interaction) {
      responseData.pix = {
        qrCode: mpData.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: mpData.point_of_interaction.transaction_data.qr_code_base64,
        ticketUrl: mpData.point_of_interaction.transaction_data.ticket_url
      };
    }

    logInfo('Processamento concluído com sucesso', { paymentId: mpData.id });

    return createSuccessResponse(responseData);

  } catch (error: any) {
    logError('Erro fatal não tratado', { message: error.message, stack: error.stack });
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Erro interno do servidor', 500, error.message);
  }
});
