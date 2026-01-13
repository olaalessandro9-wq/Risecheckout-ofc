/**
 * affiliate-pixel-management Edge Function
 * 
 * Gerencia pixels de tracking para afiliados.
 * Ações: save-all (atômico: delete + insert)
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-producer-token",
};

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

// =====================================================
// SESSION VALIDATION
// =====================================================

interface SessionData {
  user_id: string;
  expires_at: string;
}

async function validateProducerSession(
  supabaseClient: any,
  token: string
): Promise<{ userId: string } | null> {
  const { data, error } = await supabaseClient
    .from("producer_sessions")
    .select("user_id, expires_at")
    .eq("session_token", token)
    .eq("is_valid", true)
    .single();

  if (error || !data) return null;
  
  const sessionData = data as SessionData;
  if (new Date(sessionData.expires_at) < new Date()) return null;

  return { userId: sessionData.user_id };
}

// =====================================================
// OWNERSHIP VALIDATION
// =====================================================

interface AffiliateData {
  id: string;
  user_id: string;
}

async function validateAffiliateOwnership(
  supabaseClient: any,
  affiliateId: string,
  userId: string
): Promise<boolean> {
  // Verificar se o afiliado pertence ao usuário logado
  const { data, error } = await supabaseClient
    .from("affiliates")
    .select("id, user_id")
    .eq("id", affiliateId)
    .single();

  if (error || !data) return false;
  const affiliateData = data as AffiliateData;
  return affiliateData.user_id === userId;
}

// =====================================================
// HANDLERS
// =====================================================

async function handleSaveAll(
  supabaseClient: any,
  payload: SaveAllPayload,
  userId: string
): Promise<Response> {
  const { affiliate_id, pixels } = payload;

  if (!affiliate_id) {
    return new Response(
      JSON.stringify({ error: "affiliate_id é obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validar ownership
  const isOwner = await validateAffiliateOwnership(supabaseClient, affiliate_id, userId);
  if (!isOwner) {
    return new Response(
      JSON.stringify({ error: "Não autorizado: você não é dono desta afiliação" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validação de limite
  if (pixels && pixels.length > 200) {
    return new Response(
      JSON.stringify({ error: "Máximo de 200 pixels permitidos" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Deletar todos os pixels existentes deste afiliado
    const { error: deleteError } = await supabaseClient
      .from("affiliate_pixels")
      .delete()
      .eq("affiliate_id", affiliate_id);

    if (deleteError) throw deleteError;

    // 2. Inserir novos pixels (se houver)
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
  } catch (error: any) {
    console.error("[affiliate-pixel-management] Save error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao salvar pixels" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate session
    const token = req.headers.get("x-producer-token");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token de sessão não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await validateProducerSession(supabase, token);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const { action, ...payload } = body;

    console.log(`[affiliate-pixel-management] Action: ${action}, User: ${session.userId}`);

    switch (action) {
      case "save-all":
        return handleSaveAll(supabase, payload as SaveAllPayload, session.userId);

      default:
        return new Response(
          JSON.stringify({ error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("[affiliate-pixel-management] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
