/**
 * get-pix-status - Consulta status do PIX de forma pública
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Esta Edge Function permite recuperar o estado do pagamento PIX
 * apenas com o orderId, sem necessidade de accessToken.
 * 
 * SEGURANÇA:
 * - Retorna APENAS campos públicos (qr_code, status, amount)
 * - NÃO retorna dados do cliente (nome, email, CPF, telefone)
 * - NÃO retorna access_token
 * - orderId é UUID, difícil de adivinhar
 * 
 * USO:
 * - Recuperação de página PIX após refresh
 * - Acesso direto via URL
 * - Fallback quando navState é perdido
 * 
 * @version 1.0.0
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("get-pix-status");

// ============================================================================
// TYPES
// ============================================================================

interface GetPixStatusRequest {
  orderId: string;
}

interface OrderPixData {
  pix_qr_code: string | null;
  pix_status: string | null;
  pix_id: string | null;
  amount_cents: number;
  status: string;
  checkout_id: string | null;
}

interface CheckoutSlugData {
  slug: string | null;
}

// ============================================================================
// VALIDATION
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(withSentry('get-pix-status', async (req) => {
  // CORS handling
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Parse request
    const body: GetPixStatusRequest = await req.json();
    const { orderId } = body;

    log.info("Buscando status PIX", { orderId });

    // Validate orderId
    if (!orderId || !isValidUUID(orderId)) {
      log.warn("orderId inválido", { orderId });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "orderId inválido ou não fornecido" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client
    const supabase = getSupabaseClient('payments');

    // Fetch order PIX data (only public fields)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("pix_qr_code, pix_status, pix_id, amount_cents, status, checkout_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      log.warn("Pedido não encontrado", { orderId, error: orderError?.message });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Pedido não encontrado" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const orderData = order as OrderPixData;

    // Fetch checkout slug for navigation
    let checkoutSlug: string | null = null;
    if (orderData.checkout_id) {
      const { data: checkout } = await supabase
        .from("checkouts")
        .select("slug")
        .eq("id", orderData.checkout_id)
        .single();
      
      checkoutSlug = (checkout as CheckoutSlugData | null)?.slug || null;
    }

    log.info("Status PIX retornado", { 
      orderId, 
      hasPix: !!orderData.pix_qr_code,
      pixStatus: orderData.pix_status,
      orderStatus: orderData.status,
    });

    // Return only public data (SECURITY: no PII)
    return new Response(
      JSON.stringify({
        success: true,
        pix_qr_code: orderData.pix_qr_code,
        pix_status: orderData.pix_status,
        pix_id: orderData.pix_id,
        amount_cents: orderData.amount_cents,
        order_status: orderData.status,
        checkout_slug: checkoutSlug,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro ao buscar status PIX", { error: errorMessage });

    await captureException(error instanceof Error ? error : new Error(String(error)), {
      functionName: 'get-pix-status',
      url: req.url,
      method: req.method,
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}));
