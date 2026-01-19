/**
 * Edge Function: get-users-with-emails
 * 
 * Retorna emails dos usuários para owners.
 * 
 * Regras de segurança:
 * - Apenas owner pode ver emails
 * - Outros roles recebem lista vazia
 * - CORS restrito a domínios permitidos
 * - Autenticação via producer_sessions (unified-auth)
 * 
 * @version 2.0.0 - RISE V3 Compliance (unified-auth migration)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("get-users-with-emails");

Deno.serve(async (req: Request) => {
  // SECURITY: Validação CORS com bloqueio de origens inválidas
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight response
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Rate limiting para ações admin
    const rateLimitResult = await rateLimitMiddleware(
      supabaseAdmin,
      req,
      RATE_LIMIT_CONFIGS.ADMIN_ACTION,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // RISE V3: Autenticação via producer_sessions (unified-auth)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch {
      return new Response(
        JSON.stringify({ error: "Não autorizado", emails: {} }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apenas owner pode ver emails
    if (producer.role !== "owner") {
      log.info(`Acesso negado para ${producer.id} (role: ${producer.role})`);
      return new Response(
        JSON.stringify({ emails: {} }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar todos os usuários do auth.users via service role
    const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      log.error("Erro ao buscar usuários:", usersError);
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

    log.info(`Owner ${producer.id} buscou ${Object.keys(emails).length} emails`);

    return new Response(
      JSON.stringify({ emails }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro inesperado:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor", emails: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
