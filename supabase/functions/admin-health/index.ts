/**
 * Edge Function: admin-health
 * 
 * Responsabilidade: Operações administrativas de health check e resolução de erros
 * 
 * Ações:
 * - resolve-error: Marca um erro como resolvido
 * 
 * Segurança:
 * - Usa unified-auth (producer_sessions)
 * - Valida role Admin/Owner
 * 
 * @version 2.0.0
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-producer-session-token',
};

interface ResolveErrorPayload {
  action: string;
  errorId: string;
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate using unified-auth (producer_sessions)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      console.warn("[admin-health] Autenticação falhou");
      return unauthorizedResponse(corsHeaders);
    }

    // Check if user is admin - busca de user_roles (não profiles)
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", producer.id)
      .single();

    if (roleError || !userRole || (userRole.role !== "admin" && userRole.role !== "owner")) {
      console.warn(`[admin-health] Acesso negado para producer ${producer.id} com role ${userRole?.role || 'não encontrada'}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso restrito a administradores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Corpo da requisição inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { action, errorId, notes } = body as unknown as ResolveErrorPayload;

    console.log(`[admin-health] Action: ${action}, Producer: ${producer.id}`);

    // Handle actions
    if (action === "resolve-error" && req.method === "POST") {
      if (!errorId) {
        return new Response(
          JSON.stringify({ success: false, error: "errorId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: Record<string, unknown> = {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: producer.id,
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from("edge_function_errors")
        .update(updateData)
        .eq("id", errorId);

      if (error) {
        console.error("[admin-health] Erro ao resolver:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao marcar como resolvido" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[admin-health] Error ${errorId} resolved by ${producer.id}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Ação desconhecida: ${action || 'não especificada'}` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[admin-health] Erro não tratado:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
