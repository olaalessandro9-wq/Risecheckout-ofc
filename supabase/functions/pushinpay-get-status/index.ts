/**
 * Edge Function: pushinpay-get-status
 * 
 * Consulta o status de um PIX via PushinPay seguindo a documentação oficial:
 * https://app.theneo.io/pushinpay/pix/pix/consultar-pix
 * 
 * Endpoint correto: GET /api/transactions/{id}
 * 
 * @author RiseCheckout Team
 * @version 2.1.0 - Zero `any` compliance (RISE Protocol V2)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getGatewayCredentials,
  validateCredentials
} from "../_shared/platform-config.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

// Use public CORS for checkout/payment endpoints
const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("pushinpay-get-status");

// URLs corretas conforme documentação oficial
const PUSHINPAY_URLS = {
  sandbox: 'https://api-sandbox.pushinpay.com.br/api/transactions',
  production: 'https://api.pushinpay.com.br/api/transactions'
};

interface GetStatusRequest {
  orderId: string;
}

interface PushinPayStatusResponse {
  id: string;
  status: string;
  value: number;
  paid_at?: string;
  payer_name?: string;
  payer_document?: string;
  end_to_end_id?: string;
  created_at: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  log.info('Iniciando');

  try {
    // 1. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn('Rate limit exceeded', { ip: getClientIP(req) });
      return rateLimitResult;
    }

    // 2. Parse request body
    const body: GetStatusRequest = await req.json();
    const { orderId } = body;

    log.info('Request', { orderId });

    // 3. Validações
    if (!orderId) {
      throw new Error('orderId é obrigatório');
    }

    // 4. Buscar pedido e pix_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, pix_id, status, pix_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log.error('Pedido não encontrado', { orderId, error: orderError });
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    if (!order.pix_id) {
      log.warn('Pedido sem pix_id', { orderId });
      return new Response(JSON.stringify({
        success: true,
        status: order.pix_status || order.status || 'unknown',
        message: 'PIX ainda não foi gerado para este pedido'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    log.info('Buscando status', { pix_id: order.pix_id, vendor_id: order.vendor_id });

    // 5. Buscar credenciais via getGatewayCredentials (Owner usa secrets globais)
    let credentialsResult;
    try {
      credentialsResult = await getGatewayCredentials(supabase, order.vendor_id, 'pushinpay');
    } catch (credError: unknown) {
      const errorMessage = credError instanceof Error ? credError.message : String(credError);
      log.error('Erro ao buscar credenciais', { error: errorMessage });
      throw new Error(`Configurações do PushinPay não encontradas: ${errorMessage}`);
    }

    if (!credentialsResult.success || !credentialsResult.credentials) {
      throw new Error(`Credenciais PushinPay não encontradas: ${credentialsResult.error}`);
    }
    
    const { isOwner, credentials, source } = credentialsResult;
    
    // Validar credenciais
    const validation = validateCredentials('pushinpay', credentials);
    if (!validation.valid) {
      throw new Error(`Token do PushinPay não configurado. Campos faltantes: ${validation.missingFields.join(', ')}`);
    }

    const token = credentials.token || '';
    const environment = credentials.environment || 'production';
    const baseUrl = environment === 'sandbox' 
      ? PUSHINPAY_URLS.sandbox 
      : PUSHINPAY_URLS.production;

    log.info('Credenciais obtidas', { source, isOwner });

    // 6. Consultar status na API do PushinPay
    // Endpoint: GET /api/transactions/{id}
    const apiUrl = `${baseUrl}/${order.pix_id}`;
    log.debug('Consultando API', { url: apiUrl });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const responseText = await response.text();
    log.info('Resposta da API', { status: response.status });

    if (!response.ok) {
      log.error('Erro na API PushinPay', { status: response.status, response: responseText });
      throw new Error(`PushinPay retornou erro: ${response.status}`);
    }

    const statusData: PushinPayStatusResponse = JSON.parse(responseText);
    log.info('Status do PIX', { status: statusData.status });

    // 7. Mapear status do PushinPay para status interno
    const mappedStatus = mapPushinPayStatus(statusData.status);
    const isPaid = mappedStatus === 'paid';

    // 8. Atualizar pedido se status mudou
    if (order.pix_status !== statusData.status) {
      const updateData: Record<string, string> = {
        pix_status: statusData.status
      };

      if (isPaid) {
        updateData.status = 'paid';
        updateData.paid_at = statusData.paid_at || new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        log.error('Erro ao atualizar pedido', { error: updateError });
      } else {
        log.info('Pedido atualizado', { status: mappedStatus });
      }
    }

    // 9. Retornar status
    return new Response(JSON.stringify({
      success: true,
      status: mappedStatus,
      rawStatus: statusData.status,
      isPaid,
      paidAt: statusData.paid_at,
      payerName: statusData.payer_name,
      payerDocument: statusData.payer_document,
      endToEndId: statusData.end_to_end_id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Erro', { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Mapeia o status do PushinPay para status interno padronizado
 */
function mapPushinPayStatus(pushinStatus: string): string {
  const status = pushinStatus?.toLowerCase();
  
  switch (status) {
    case 'paid':
    case 'approved':
    case 'confirmed':
      return 'paid';
    case 'cancelled':
    case 'canceled':
    case 'expired':
      return 'cancelled';
    case 'pending':
    case 'waiting':
    case 'processing':
    case 'created':
      return 'pending';
    default:
      return status || 'unknown';
  }
}
