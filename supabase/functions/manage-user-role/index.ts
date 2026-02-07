/**
 * Edge Function: manage-user-role
 * 
 * Permite que admins e owners alterem roles de usuários.
 * 
 * RISE V3: Step-Up MFA (Owner) - Todas as operações de mudança de role
 * exigem o código TOTP do Owner do sistema, mesmo que o caller seja admin.
 * 
 * Regras de segurança:
 * - Apenas admin e owner podem usar esta função
 * - Admin pode promover: seller ↔ user
 * - Owner pode fazer qualquer promoção/rebaixamento
 * - Ninguém pode rebaixar a si mesmo
 * - TODAS as operações exigem MFA do Owner (Step-Up Level 2 / OWNER_MFA)
 * - Todas as ações são registradas no audit log
 * - CORS restrito a domínios permitidos
 * 
 * @version 3.0.0 - Step-Up MFA Owner integration + Sentry
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { guardCriticalOperation, CriticalLevel } from "../_shared/critical-operation-guard.ts";
import { createLogger } from "../_shared/logger.ts";
import { withSentry } from "../_shared/sentry.ts";

const log = createLogger("manage-user-role");

type AppRole = "owner" | "admin" | "user" | "seller";

interface RequestBody {
  targetUserId: string;
  newRole: AppRole;
  ownerMfaCode?: string;
}

Deno.serve(withSentry("manage-user-role", async (req: Request) => {
  // SECURITY: CORS V2 com separação de ambiente (prod/dev)
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult; // Retorna 403 ou preflight response
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseAdmin = getSupabaseClient('admin');

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

    // SECURITY: Autenticação via unified-auth
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabaseAdmin, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const callerRole = producer.role as AppRole;

    if (callerRole !== "admin" && callerRole !== "owner") {
      log.warn(`Acesso negado para ${producer.id} (role: ${callerRole})`);
      
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
    const { targetUserId, newRole, ownerMfaCode } = body;

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
      log.warn(`TENTATIVA BLOQUEADA de promoção para owner por ${producer.id}`);
      
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

    // ========================================================================
    // STEP-UP MFA: Require Owner's TOTP for ALL role changes
    // ========================================================================
    const guardResult = await guardCriticalOperation({
      supabase: supabaseAdmin,
      req,
      corsHeaders,
      level: CriticalLevel.OWNER_MFA,
      totpCode: ownerMfaCode,
      callerId: producer.id,
      callerRole: producer.role,
      operationName: "manage-user-role",
    });
    if (guardResult) return guardResult;
    // ========================================================================

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
      log.error("Erro ao atualizar role:", updateError);
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
        mfaVerified: true,
      },
    });

    log.info(`Role alterado: ${targetUserId} de ${currentRole} para ${newRole} por ${producer.id} (MFA Owner verified)`);

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
    log.error("Erro inesperado:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}));
