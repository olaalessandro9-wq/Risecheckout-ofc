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
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiter.ts";

type AppRole = "owner" | "admin" | "user" | "seller";

Deno.serve(async (req: Request) => {
  // SECURITY: Validação CORS com bloqueio de origens inválidas
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight response
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limiting para ações admin
    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin,
      req,
      RATE_LIMIT_CONFIGS.ADMIN_ACTION
    );
    if (rateLimitResult) {
      console.warn(`[get-users-with-emails] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[get-users-with-emails] Erro inesperado:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", emails: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
