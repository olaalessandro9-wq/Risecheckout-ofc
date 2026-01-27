/**
 * Login Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Authenticates user and creates session with appropriate role context.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse } from "../../_shared/response-helpers.ts";
import {
  verifyPassword,
  createSession,
  createAuthResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import { AccountStatus } from "../../_shared/auth-constants.ts";

const log = createLogger("UnifiedAuth:Login");

interface LoginRequest {
  email: string;
  password: string;
  preferredRole?: AppRole;
}

export async function handleLogin(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: LoginRequest = await req.json();
    const { email, password, preferredRole } = body;
    
    // Validate input
    if (!email || !password) {
      return errorResponse("Email e senha são obrigatórios", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user in unified users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password_hash, account_status, is_active")
      .eq("email", normalizedEmail)
      .single();
    
    if (userError || !user) {
      log.debug("User not found:", normalizedEmail);
      return errorResponse("Credenciais inválidas", corsHeaders, 401);
    }
    
    // Check if user is active
    if (!user.is_active) {
      return errorResponse("Conta desativada", corsHeaders, 403);
    }
    
    // Check account status
    if (user.account_status === AccountStatus.PENDING_SETUP) {
      return errorResponse("Conta pendente de configuração", corsHeaders, 403);
    }
    
    if (user.account_status === AccountStatus.RESET_REQUIRED) {
      return errorResponse("Redefinição de senha necessária", corsHeaders, 403);
    }
    
    // Verify password
    if (!user.password_hash) {
      return errorResponse("Conta sem senha configurada", corsHeaders, 403);
    }
    
    // Sync function - no await needed
    const validPassword = verifyPassword(password, user.password_hash);
    if (!validPassword) {
      log.debug("Invalid password for:", normalizedEmail);
      return errorResponse("Credenciais inválidas", corsHeaders, 401);
    }
    
    // Get user roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const roles: AppRole[] = (userRoles || []).map(r => r.role as AppRole);
    
    // Ensure buyer role is always included
    if (!roles.includes("buyer")) {
      roles.push("buyer");
    }
    
    // RISE V3: Fallback para usuários sem role de produtor (migração de dados antigos)
    // Se só tem buyer e veio de cadastro de produtor/afiliado, atribuir seller
    if (roles.length === 1 && roles[0] === "buyer") {
      const { data: userData } = await supabase
        .from("users")
        .select("registration_source")
        .eq("id", user.id)
        .single();
      
      if (userData?.registration_source === "organic" || 
          userData?.registration_source === "affiliate") {
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: user.id,
          role: "seller",
        });
        
        if (!roleError) {
          roles.push("seller");
          log.info("Auto-assigned seller role based on registration_source", {
            userId: user.id,
            source: userData.registration_source,
          });
        }
      }
    }
    
    // Determine active role
    let activeRole: AppRole = "buyer"; // Default
    
    // Check preferred role from user's last context
    const { data: lastContext } = await supabase
      .from("user_active_context")
      .select("active_role")
      .eq("user_id", user.id)
      .single();
    
    if (lastContext?.active_role && roles.includes(lastContext.active_role as AppRole)) {
      activeRole = lastContext.active_role as AppRole;
    } else if (preferredRole && roles.includes(preferredRole)) {
      activeRole = preferredRole;
    } else if (roles.some(r => ["owner", "admin", "user", "seller"].includes(r))) {
      // Producer-type roles take precedence
      activeRole = roles.find(r => ["owner", "admin", "user", "seller"].includes(r)) || "seller";
    }
    
    // RISE V3: Invalidar sessões anteriores para evitar acúmulo
    // Mantém no máximo 5 sessões ativas por usuário
    const { data: existingSessions } = await supabase
      .from("sessions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("is_valid", true)
      .order("created_at", { ascending: false });
    
    if (existingSessions && existingSessions.length >= 5) {
      // Invalidar sessões mais antigas (manter apenas as 4 mais recentes + nova)
      const sessionsToInvalidate = existingSessions.slice(4).map(s => s.id);
      if (sessionsToInvalidate.length > 0) {
        await supabase
          .from("sessions")
          .update({ is_valid: false })
          .in("id", sessionsToInvalidate);
        log.info("Invalidated old sessions", { count: sessionsToInvalidate.length });
      }
    }
    
    // Create session
    const session = await createSession(supabase, user.id, activeRole, req);
    if (!session) {
      return errorResponse("Erro ao criar sessão", corsHeaders, 500);
    }
    
    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);
    
    log.info("Login successful", { userId: user.id, activeRole });
    
    return createAuthResponse(session, user, roles, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Login error:", msg);
    return errorResponse("Erro ao processar login", corsHeaders, 500);
  }
}
