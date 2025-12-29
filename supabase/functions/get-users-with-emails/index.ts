/**
 * Edge Function: get-users-with-emails
 * 
 * Retorna emails dos usuários para owners.
 * 
 * Regras de segurança:
 * - Apenas owner pode ver emails
 * - Outros roles recebem lista vazia
 * - CORS restrito a domínios permitidos
 * 
 * @version 1.1.0
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

type AppRole = "owner" | "admin" | "user" | "seller";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado", emails: {} }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado", emails: {} }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar role do caller
    const { data: callerRoleData, error: callerRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (callerRoleError || !callerRoleData) {
      console.error("[get-users-with-emails] Erro ao buscar role:", callerRoleError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões", emails: {} }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerRole = callerRoleData.role as AppRole;

    // Apenas owner pode ver emails
    if (callerRole !== "owner") {
      console.log(`[get-users-with-emails] Acesso negado para ${caller.id} (role: ${callerRole})`);
      return new Response(
        JSON.stringify({ emails: {} }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar todos os usuários do auth.users via service role
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("[get-users-with-emails] Erro ao buscar usuários:", usersError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar emails", emails: {} }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear user_id -> email
    const emails: Record<string, string> = {};
    for (const user of authUsers.users) {
      if (user.email) {
        emails[user.id] = user.email;
      }
    }

    console.log(`[get-users-with-emails] Owner ${caller.id} buscou ${Object.keys(emails).length} emails`);

    return new Response(
      JSON.stringify({ emails }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[get-users-with-emails] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", emails: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
