/**
 * affiliate-pixel-management Edge Function
 * 
 * @version 4.0.0 - RISE Protocol V3 Compliant (Vertical Slice Architecture)
 * - Uses Shared Kernel for ownership validation
 * - Zero duplicate code
 *
 * Gerencia pixels de tracking para afiliados.
 * Ações: save-all (atômico: delete + insert)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse, ProducerAuth } from "../_shared/unified-auth.ts";
import { verifyAffiliateOwnership } from "../_shared/ownership.ts";

// ============================================
// TYPES
// ============================================

interface PixelData {
  pixel_id: string;
  platform: string;
  domain?: string | null;
  fire_on_pix: boolean;
  fire_on_boleto: boolean;
  fire_on_card: boolean;
  custom_value_pix: number;
  custom_value_boleto: number;
  custom_value_card: number;
  enabled: boolean;
}

interface SaveAllPayload {
  affiliate_id: string;
  pixels: PixelData[];
}

// ============================================
// CONSTANTS
// ============================================

const MAX_PIXELS = 200;

// ============================================
// HANDLERS
// ============================================

async function handleSaveAll(
  supabaseClient: SupabaseClient,
  payload: SaveAllPayload,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { affiliate_id, pixels } = payload;

  if (!affiliate_id) {
    return new Response(
      JSON.stringify({ error: "affiliate_id é obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate ownership using Shared Kernel
  const isOwner = await verifyAffiliateOwnership(supabaseClient, affiliate_id, userId);
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: "Não autorizado: você não é dono desta afiliação" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate pixel limit
  if (pixels && pixels.length > MAX_PIXELS) {
    return new Response(
      JSON.stringify({ error: `Máximo de ${MAX_PIXELS} pixels permitidos` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Delete all existing pixels for this affiliate
    const { error: deleteError } = await supabaseClient
      .from("affiliate_pixels")
      .delete()
      .eq("affiliate_id", affiliate_id);

    if (deleteError) throw deleteError;

    // 2. Insert new pixels (if any)
    if (pixels && pixels.length > 0) {
      const pixelsToInsert = pixels
        .filter(p => p.pixel_id && p.pixel_id.trim())
        .map(p => ({
          affiliate_id,
          platform: p.platform,
          pixel_id: p.pixel_id.trim(),
          domain: p.domain?.trim() || null,
          fire_on_pix: p.fire_on_pix ?? true,
          fire_on_boleto: p.fire_on_boleto ?? true,
          fire_on_card: p.fire_on_card ?? true,
          custom_value_pix: p.custom_value_pix ?? 100,
          custom_value_boleto: p.custom_value_boleto ?? 100,
          custom_value_card: p.custom_value_card ?? 100,
          enabled: p.enabled ?? true,
        }));

      if (pixelsToInsert.length > 0) {
        const { error: insertError } = await supabaseClient
          .from("affiliate_pixels")
          .insert(pixelsToInsert);

        if (insertError) throw insertError;
      }
    }

    console.log(`[affiliate-pixel-management] Saved ${pixels?.length || 0} pixels for affiliate ${affiliate_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pixels salvos com sucesso",
        count: pixels?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[affiliate-pixel-management] Save error:", error);
    const message = error instanceof Error ? error.message : "Erro ao salvar pixels";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authentication
    let producer: ProducerAuth;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Parse body
    const body = await req.json();
    const { action, ...payload } = body;

    console.log(`[affiliate-pixel-management] Action: ${action}, User: ${producer.id}`);

    switch (action) {
      case "save-all":
        return handleSaveAll(supabase, payload as SaveAllPayload, producer.id, corsHeaders);

      default:
        return new Response(
          JSON.stringify({ error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[affiliate-pixel-management] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
