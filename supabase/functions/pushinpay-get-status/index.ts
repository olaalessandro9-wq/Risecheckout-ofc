/**
 * Edge Function: pushinpay-get-status
 * 
 * Consulta o status de um PIX via PushinPay seguindo a documentação oficial:
 * https://app.theneo.io/pushinpay/pix/pix/consultar-pix
 * 
 * Endpoint correto: GET /api/transactions/{id}
 * 
 * @author RiseCheckout Team
 * @version 2.0.0 - Refatorado conforme documentação oficial
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getGatewayCredentials,
  validateCredentials
} from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // 1. Parse request body
    const body: GetStatusRequest = await req.json();
    const { orderId } = body;

    console.log(`[${functionName}] orderId=${orderId}`);

    // 2. Validações
    if (!orderId) {
      throw new Error('orderId é obrigatório');
    }

    // 3. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    } catch (credError: any) {
      console.error(`[${functionName}] Erro ao buscar credenciais:`, credError.message);
      throw new Error(`Configurações do PushinPay não encontradas: ${credError.message}`);
    }

    const { isOwner, credentials, source } = credentialsResult;
    
    // Validar credenciais
    const validation = validateCredentials('pushinpay', credentials);
    if (!validation.valid) {
      throw new Error(`Token do PushinPay não configurado. Campos faltantes: ${validation.missingFields.join(', ')}`);
    }

    const token = credentials.token!;
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
      const updateData: Record<string, any> = {
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

  } catch (error: any) {
    console.error(`[${functionName}] Erro:`, error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
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
