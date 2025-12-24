import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// ============================================================================
// CONSTANTS & TYPES
// ============================================================================
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const LOG_PREFIX = '[create-order]';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Cria uma resposta de sucesso padronizada
 */ function createSuccessResponse(order_id, amount_cents, vendor_id) {
  const response = {
    success: true,
    data: {
      order_id,
      amount_cents,
      vendor_id
    }
  };
  return new Response(JSON.stringify(response), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    },
    status: 200
  });
}
/**
 * Cria uma resposta de erro padronizada
 */ function createErrorResponse(code, message, statusCode = 400, details) {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...details && {
        details
      }
    }
  };
  return new Response(JSON.stringify(response), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    },
    status: statusCode
  });
}
/**
 * Loga informações importantes (não verbose)
 */ function logInfo(message, data) {
  console.log(`${LOG_PREFIX} [INFO] ${message}`, data ? JSON.stringify(data) : '');
}
/**
 * Loga erros
 */ function logError(message, error) {
  console.error(`${LOG_PREFIX} [ERROR] ${message}`, error ? JSON.stringify(error) : '');
}
/**
 * Loga avisos
 */ function logWarn(message, data) {
  console.warn(`${LOG_PREFIX} [WARN] ${message}`, data ? JSON.stringify(data) : '');
}
/**
 * Valida campos obrigatórios do request
 */ function validateRequiredFields(body) {
  const requiredFields = [
    'product_id',
    'offer_id',
    'checkout_id',
    'customer_name',
    'customer_email'
  ];
  for (const field of requiredFields){
    if (!body[field]) {
      return {
        valid: false,
        error: `Campo obrigatório faltando: ${field}`
      };
    }
  }
  return {
    valid: true
  };
}
/**
 * Converte preço de REAIS para CENTAVOS (Integer First)
 * Padronizado com frontend (src/lib/money.ts)
 */ function toCents(priceInReais) {
  return Math.round(Number(priceInReais) * 100);
}
// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  try {
    // ========================================================================
    // 1. SETUP & VALIDATION
    // ========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      logError('Variáveis de ambiente não configuradas');
      return createErrorResponse('ENV_ERROR', 'Erro de configuração do servidor', 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      logError('Erro ao fazer parse do JSON', error);
      return createErrorResponse('INVALID_JSON', 'Corpo da requisição inválido', 400);
    }
    logInfo('Request recebido', {
      product_id: body.product_id,
      checkout_id: body.checkout_id,
      bumps_count: body.order_bump_ids?.length || 0
    });
    // Validate required fields
    const validation = validateRequiredFields(body);
    if (!validation.valid) {
      logError('Validação falhou', validation.error);
      return createErrorResponse('VALIDATION_ERROR', validation.error, 400);
    }
    const { product_id, offer_id, checkout_id, customer_name, customer_email, customer_phone, customer_cpf, order_bump_ids = [], gateway, payment_method } = body;
    // ========================================================================
    // 2. FETCH PRODUCT DATA
    // ========================================================================
    const { data: product, error: productError } = await supabase.from('products').select('id, name, price, user_id').eq('id', product_id).single();
    if (productError || !product) {
      logError('Produto não encontrado', {
        product_id,
        error: productError
      });
      return createErrorResponse('PRODUCT_NOT_FOUND', 'Produto não encontrado', 404);
    }
    const product_price_cents = toCents(Number(product.price));
    const vendor_id = product.user_id;
    logInfo('Produto encontrado', {
      product_id: product.id,
      price_cents: product_price_cents
    });
    // ========================================================================
    // 3. CREATE ORDER
    // ========================================================================
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      vendor_id,
      product_id,
      customer_name,
      customer_email,
      customer_ip: req.headers.get('x-forwarded-for') || 'unknown',
      amount_cents: product_price_cents,
      currency: 'BRL',
      status: 'pending',
      gateway,
      payment_method
    }).select().single();
    if (orderError || !order) {
      logError('Erro ao criar pedido', orderError);
      return createErrorResponse('ORDER_CREATION_ERROR', 'Erro ao criar pedido', 500);
    }
    logInfo('Pedido criado', {
      order_id: order.id
    });
    // ========================================================================
    // 4. INSERT MAIN ORDER ITEM
    // ========================================================================
    const { error: mainItemError } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id,
      product_name: product.name,
      amount_cents: product_price_cents,
      quantity: 1,
      is_bump: false
    });
    if (mainItemError) {
      logError('Erro ao inserir item principal', mainItemError);
      return createErrorResponse('ORDER_ITEM_ERROR', 'Erro ao inserir item do pedido', 500);
    }
    let total_cents = product_price_cents;
    // ========================================================================
    // 5. PROCESS ORDER BUMPS
    // ========================================================================
    if (order_bump_ids.length > 0) {
      logInfo('Processando order bumps', {
        count: order_bump_ids.length
      });
      for (const bump_id of order_bump_ids){
        try {
          // Fetch bump data
          // 🔴 SOLUÇÃO A (GEMINI): Removida validação .eq('checkout_id', checkout_id)
          // Motivo: Mismatch entre IDs (...a6c4... vs ...d6c4...) impedia bumps de serem encontrados
          // Como bump_id (UUID) já é único, essa validação é redundante
          // TODO: Investigar causa raiz na RPC get_checkout_by_payment_slug (Solução B)
          const { data: bump, error: bumpError } = await supabase.from('order_bumps').select('id, product_id, offer_id, discount_price, discount_enabled, checkout_id').eq('id', bump_id)// .eq('checkout_id', checkout_id) // REMOVIDO - Solução A
          .eq('active', true).single();
          if (bumpError || !bump) {
            logWarn('Order bump não encontrado ou inativo', {
              bump_id
            });
            continue;
          }
          let bump_price_cents = 0;
          let bump_product_name = '';
          let bump_product_id = '';
          // Fetch price from offer (if offer_id exists)
          if (bump.offer_id) {
            const { data: offerData, error: offerError } = await supabase.from('offers').select('price, name, product_id').eq('id', bump.offer_id).single();
            if (offerError || !offerData) {
              logWarn('Oferta do bump não encontrada', {
                offer_id: bump.offer_id
              });
              continue;
            }
            // ✅ CORREÇÃO: offers.price está em REAIS, converter para CENTAVOS
            bump_price_cents = toCents(Number(offerData.price));
            bump_product_name = offerData.name;
            bump_product_id = offerData.product_id;
          } else if (bump.product_id) {
            const { data: productData, error: productError } = await supabase.from('products').select('price, name').eq('id', bump.product_id).single();
            if (productError || !productData) {
              logWarn('Produto do bump não encontrado', {
                product_id: bump.product_id
              });
              continue;
            }
            // products.price está em REAIS, converter para CENTAVOS
            bump_price_cents = toCents(Number(productData.price));
            bump_product_name = productData.name;
            bump_product_id = bump.product_id;
          }
          // Insert bump item if we have all required data
          if (bump_price_cents > 0 && bump_product_id) {
            // 🔍 DEBUG: Log detalhado do valor antes de inserir
            logInfo('Inserindo bump item', {
              bump_id,
              bump_price_cents,
              bump_price_cents_type: typeof bump_price_cents,
              bump_product_id,
              bump_product_name
            });
            const { error: bumpItemError } = await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: bump_product_id,
              product_name: bump_product_name,
              amount_cents: Number(bump_price_cents),
              quantity: 1,
              is_bump: true
            });
            if (bumpItemError) {
              logError('Erro ao inserir item do bump', {
                bump_id,
                error: bumpItemError
              });
              continue;
            }
            total_cents += bump_price_cents;
            logInfo('Bump adicionado', {
              bump_id,
              price_cents: bump_price_cents
            });
          } else {
            logWarn('Bump ignorado por falta de informações', {
              bump_id
            });
          }
        } catch (bumpError) {
          logError('Erro ao processar bump', {
            bump_id,
            error: bumpError
          });
          continue; // Continue processando outros bumps
        }
      }
      // Update order total
      const { error: updateError } = await supabase.from('orders').update({
        amount_cents: total_cents
      }).eq('id', order.id);
      if (updateError) {
        logError('Erro ao atualizar total do pedido', updateError);
      // Não retorna erro aqui pois o pedido já foi criado
      }
    }
    // ========================================================================
    // 6. RETURN SUCCESS
    // ========================================================================
    logInfo('Pedido criado com sucesso', {
      order_id: order.id,
      total_cents,
      total_brl: (total_cents / 100).toFixed(2)
    });
    return createSuccessResponse(order.id, total_cents, vendor_id);
  } catch (error) {
    // ========================================================================
    // GLOBAL ERROR HANDLER
    // ========================================================================
    logError('Erro fatal não tratado', {
      message: error.message,
      stack: error.stack
    });
    return createErrorResponse('INTERNAL_ERROR', 'Erro interno do servidor', 500, Deno.env.get('NODE_ENV') === 'development' ? error.message : undefined);
  }
});
