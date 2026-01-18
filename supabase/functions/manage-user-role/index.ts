/**
 * Edge Function: manage-user-role
 * 
 * Permite que admins e owners alterem roles de usuários.
 * 
 * Regras de segurança:
 * - Apenas admin e owner podem usar esta função
 * - Admin pode promover: seller ↔ user
 * - Owner pode fazer qualquer promoção/rebaixamento
 * - Ninguém pode rebaixar a si mesmo
 * - Todas as ações são registradas no audit log
 * - CORS restrito a domínios permitidos
 * 
 * @version 1.1.0
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

type AppRole = "owner" | "admin" | "user" | "seller";

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 1,
  admin: 2,
  user: 3,
  seller: 4,
};

interface RequestBody {
  targetUserId: string;
  newRole: AppRole;
}

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
      RATE_LIMIT_CONFIGS.ADMIN_ACTION,
      corsHeaders
    );
    if (rateLimitResult) {
      console.warn(`[manage-user-role] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    // SECURITY: Autenticação via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const callerRole = producer.role as AppRole;

    if (callerRole !== "admin" && callerRole !== "owner") {
      console.warn(`[manage-user-role] Acesso negado para ${producer.id} (role: ${callerRole})`);
      
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: "PERMISSION_DENIED",
        p_resource: "manage-user-role",
        p_success: false,
        p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
        p_user_agent: req.headers.get("user-agent") || null,
        p_metadata: { callerRole, attemptedAction: "manage-user-role" },
      });

      return new Response(
        JSON.stringify({ error: "Você não tem permissão para gerenciar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { targetUserId, newRole } = body;

    if (!targetUserId || !newRole) {
      return new Response(
        JSON.stringify({ error: "targetUserId e newRole são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validRoles: AppRole[] = ["owner", "admin", "user", "seller"];
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: "Role inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newRole === "owner") {
      console.warn(`[manage-user-role] TENTATIVA BLOQUEADA de promoção para owner por ${producer.id}`);
      
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: producer.id,
        p_action: "BLOCKED_OWNER_PROMOTION",
        p_resource: "manage-user-role",
        p_success: false,
        p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
        p_user_agent: req.headers.get("user-agent") || null,
        p_metadata: { callerRole, targetUserId, attemptedRole: "owner" },
      });

      return new Response(
        JSON.stringify({ error: "O cargo de Owner é protegido e não pode ser atribuído via API" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetUserId === producer.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode alterar seu próprio role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: targetRoleData, error: targetRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId)
      .single();

    if (targetRoleError || !targetRoleData) {
      return new Response(
        JSON.stringify({ error: "Usuário alvo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentRole = targetRoleData.role as AppRole;

    if (callerRole === "admin") {
      if (newRole === "admin") {
        return new Response(
          JSON.stringify({ error: "Admins não podem promover para admin" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (currentRole === "admin" || currentRole === "owner") {
        return new Response(
          JSON.stringify({ error: "Admins não podem alterar roles de outros admins ou owners" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", targetUserId);

    if (updateError) {
      console.error("[manage-user-role] Erro ao atualizar role:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabaseAdmin.rpc("log_security_event", {
      p_user_id: producer.id,
      p_action: "ROLE_CHANGE",
      p_resource: "user_roles",
      p_resource_id: targetUserId,
      p_success: true,
      p_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null,
      p_user_agent: req.headers.get("user-agent") || null,
      p_metadata: {
        callerRole,
        targetUserId,
        previousRole: currentRole,
        newRole,
      },
    });

    console.log(`[manage-user-role] Role alterado: ${targetUserId} de ${currentRole} para ${newRole} por ${producer.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Role alterado de ${currentRole} para ${newRole}`,
        data: {
          targetUserId,
          previousRole: currentRole,
          newRole,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[manage-user-role] Erro inesperado:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
