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
import { getCorsHeaders } from "../_shared/cors.ts";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerRoleData, error: callerRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (callerRoleError || !callerRoleData) {
      console.error("[manage-user-role] Erro ao buscar role do caller:", callerRoleError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerRole = callerRoleData.role as AppRole;

    if (callerRole !== "admin" && callerRole !== "owner") {
      console.warn(`[manage-user-role] Acesso negado para ${caller.id} (role: ${callerRole})`);
      
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: caller.id,
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
      console.warn(`[manage-user-role] TENTATIVA BLOQUEADA de promoção para owner por ${caller.id}`);
      
      await supabaseAdmin.rpc("log_security_event", {
        p_user_id: caller.id,
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

    if (targetUserId === caller.id) {
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
      p_user_id: caller.id,
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

    console.log(`[manage-user-role] Role alterado: ${targetUserId} de ${currentRole} para ${newRole} por ${caller.id}`);

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

  } catch (error) {
    console.error("[manage-user-role] Erro inesperado:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
