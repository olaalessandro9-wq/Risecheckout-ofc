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
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";

// Use public CORS for checkout/payment endpoints
const corsHeaders = PUBLIC_CORS_HEADERS;

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

  const functionName = 'pushinpay-get-status';
  console.log(`[${functionName}] Iniciando...`);

  try {
    // 1. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA // Using same config for status checks
    );
    if (rateLimitResult) {
      console.warn(`[${functionName}] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // 2. Parse request body
    const body: GetStatusRequest = await req.json();
    const { orderId } = body;

    console.log(`[${functionName}] orderId=${orderId}`);

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
      console.error(`[${functionName}] Pedido não encontrado:`, orderError);
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    if (!order.pix_id) {
      console.warn(`[${functionName}] Pedido sem pix_id`);
      return new Response(JSON.stringify({
        success: true,
        status: order.pix_status || order.status || 'unknown',
        message: 'PIX ainda não foi gerado para este pedido'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${functionName}] pix_id=${order.pix_id}, vendor_id=${order.vendor_id}`);

    // 5. Buscar credenciais via getGatewayCredentials (Owner usa secrets globais)
    let credentialsResult;
    try {
      credentialsResult = await getGatewayCredentials(supabase, order.vendor_id, 'pushinpay');
    } catch (credError: unknown) {
      const errorMessage = credError instanceof Error ? credError.message : String(credError);
      console.error(`[${functionName}] Erro ao buscar credenciais:`, errorMessage);
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

    console.log(`[${functionName}] Credenciais obtidas via: ${source}, isOwner: ${isOwner}`);

    // 6. Consultar status na API do PushinPay
    // Endpoint: GET /api/transactions/{id}
    const apiUrl = `${baseUrl}/${order.pix_id}`;
    console.log(`[${functionName}] Consultando: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const responseText = await response.text();
    console.log(`[${functionName}] Status: ${response.status}, Response: ${responseText}`);

    if (!response.ok) {
      console.error(`[${functionName}] Erro na API PushinPay:`, responseText);
      throw new Error(`PushinPay retornou erro: ${response.status}`);
    }

    const statusData: PushinPayStatusResponse = JSON.parse(responseText);
    console.log(`[${functionName}] Status do PIX: ${statusData.status}`);

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
        console.error(`[${functionName}] Erro ao atualizar pedido:`, updateError);
      } else {
        console.log(`[${functionName}] Pedido atualizado para status: ${mappedStatus}`);
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
    console.error(`[${functionName}] Erro:`, errorMessage);
    
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
