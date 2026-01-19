/**
 * ============================================================================
 * GRANT-MEMBER-ACCESS EDGE FUNCTION
 * ============================================================================
 * 
 * @version 1.0.0 - RISE Protocol V2 Compliant
 * 
 * Função especializada para concessão de acesso à área de membros.
 * Chamada por reconcile-mercadopago, reconcile-asaas, e webhooks.
 * 
 * ============================================================================
 * RESPONSABILIDADE ÚNICA
 * ============================================================================
 * 
 * 1. Recebe dados do pedido aprovado
 * 2. Verifica se produto tem área de membros
 * 3. Cria/encontra buyer_profile
 * 4. Concede buyer_product_access
 * 5. Adiciona ao grupo padrão se existir
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

// ============================================================================
// TYPES
// ============================================================================

interface GrantAccessRequest {
  order_id: string;
  vendor_id: string;
  product_id: string;
  customer_email: string;
  customer_name?: string | null;
}

interface GrantAccessResponse {
  success: boolean;
  buyer_id?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// ============================================================================
// CONSTANTS & LOGGER
// ============================================================================

const log = createLogger("GrantMemberAccess");

// ============================================================================
// CORE LOGIC
// ============================================================================

async function grantMemberAccess(
  supabase: SupabaseClient,
  request: GrantAccessRequest
): Promise<GrantAccessResponse> {
  const { order_id, vendor_id, product_id, customer_email, customer_name } = request;

  try {
    // 1. Verificar se produto tem área de membros habilitada
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, members_area_enabled, user_id')
      .eq('id', product_id)
      .single();

    if (productError) {
      log.error('Erro ao buscar produto', productError);
      return { success: false, error: `Produto não encontrado: ${productError.message}` };
    }

    if (!product?.members_area_enabled) {
      log.info('Produto não tem área de membros', { product_id });
      return { success: true, skipped: true, reason: 'Produto sem área de membros' };
    }

    if (!customer_email) {
      return { success: false, error: 'Email do cliente não disponível' };
    }

    const normalizedEmail = customer_email.toLowerCase().trim();

    // 2. Buscar ou criar buyer_profile
    const { data: existingBuyer } = await supabase
      .from('buyer_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    let buyerId: string;

    if (!existingBuyer) {
      const { data: newBuyer, error: createError } = await supabase
        .from('buyer_profiles')
        .insert({
          email: normalizedEmail,
          name: customer_name || null,
          password_hash: 'PENDING_PASSWORD_SETUP',
          is_active: true,
        })
        .select('id')
        .single();

      if (createError) {
        log.error('Erro ao criar buyer_profile', createError);
        return { success: false, error: `Erro ao criar perfil: ${createError.message}` };
      }
      buyerId = newBuyer.id;
      log.info('Novo buyer_profile criado', { buyerId, email: normalizedEmail });
    } else {
      buyerId = existingBuyer.id;
    }

    // 3. Conceder acesso ao produto
    const { error: accessError } = await supabase
      .from('buyer_product_access')
      .upsert({
        buyer_id: buyerId,
        product_id: product_id,
        order_id: order_id,
        is_active: true,
        access_type: 'purchase',
        granted_at: new Date().toISOString(),
      }, { onConflict: 'buyer_id,product_id' });

    if (accessError) {
      log.error('Erro ao conceder acesso', accessError);
      return { success: false, error: `Erro ao conceder acesso: ${accessError.message}` };
    }

    // 4. Adicionar ao grupo padrão se existir
    const { data: defaultGroup } = await supabase
      .from('product_member_groups')
      .select('id')
      .eq('product_id', product_id)
      .eq('is_default', true)
      .single();

    if (defaultGroup?.id) {
      await supabase
        .from('buyer_groups')
        .upsert({
          buyer_id: buyerId,
          group_id: defaultGroup.id,
          is_active: true,
          granted_at: new Date().toISOString(),
        }, { onConflict: 'buyer_id,group_id' });
    }

    log.info('Acesso à área de membros concedido', { order_id, buyerId, product_id });
    return { success: true, buyer_id: buyerId };

  } catch (error: unknown) {
    log.error('Erro inesperado ao conceder acesso', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Validar autenticação interna
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      log.error('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as GrantAccessRequest;

    // Validar campos obrigatórios
    if (!body.order_id || !body.product_id || !body.vendor_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: order_id, product_id, vendor_id' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const result = await grantMemberAccess(supabase, body);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    log.error('Handler error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
