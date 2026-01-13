/**
 * Edge Function: admin-health
 * 
 * Responsabilidade: Operações administrativas de health check e resolução de erros
 * 
 * Ações:
 * - resolve-error: Marca um erro como resolvido
 * 
 * Segurança:
 * - Requer autenticação JWT
 * - Valida role Admin
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveErrorPayload {
  errorId: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) return corsResult;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Token não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
      console.warn(`[admin-health] Acesso negado para user ${user.id} com role ${profile?.role}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso restrito a administradores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

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

    console.log(`[admin-health] Action: ${action}, User: ${user.id}`);

    // Handle actions
    if (action === "resolve-error" && req.method === "POST") {
      const { errorId, notes } = body as unknown as ResolveErrorPayload;

      if (!errorId) {
        return new Response(
          JSON.stringify({ success: false, error: "errorId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: Record<string, unknown> = {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
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

      console.log(`[admin-health] Error ${errorId} resolved by ${user.id}`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
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
