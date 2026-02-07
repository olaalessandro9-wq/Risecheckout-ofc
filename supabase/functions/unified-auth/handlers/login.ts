/**
 * Login Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Authenticates user and creates session with appropriate role context.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { errorResponse, jsonResponse } from "../../_shared/response-helpers.ts";
import {
  verifyPassword,
  resolveUserSessionContext,
  createAuthResponse,
  createUnifiedAuthCookies,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";
import { AccountStatus, ACCESS_TOKEN_DURATION_MINUTES } from "../../_shared/auth-constants.ts";
import { createMfaSession } from "../../_shared/mfa-session.ts";
import { jsonResponseWithCookies } from "../../_shared/cookie-helper.ts";

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
    
    // RISE V3: Block login if email not verified
    if (user.account_status === AccountStatus.PENDING_EMAIL_VERIFICATION) {
      return errorResponse(
        "Confirme seu email antes de acessar. Verifique sua caixa de entrada.",
        corsHeaders,
        403,
      );
    }
    
    // Verify password
    if (!user.password_hash) {
      return errorResponse("Conta sem senha configurada", corsHeaders, 403);
    }
    
    // RISE V3: Structured password verification (bcrypt crash vs wrong password)
    const passwordResult = verifyPassword(password, user.password_hash);

    if (passwordResult.error) {
      // bcrypt internal crash - NOT a password mismatch
      log.error("bcrypt crash during login", {
        email: normalizedEmail,
        error: passwordResult.error,
      });
      return errorResponse("Erro interno ao verificar credenciais", corsHeaders, 500);
    }

    if (!passwordResult.valid) {
      log.info("Invalid password attempt", { email: normalizedEmail });
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
    
    // ================================================================
    // MFA CHECK (RISE V3: Admin/Owner TOTP verification)
    // ================================================================
    
    let mfaSetupRequired = false;
    const requiresMfa = roles.some(r => ["admin", "owner"].includes(r));
    
    if (requiresMfa) {
      const { data: mfaRecord } = await supabase
        .from("user_mfa")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (mfaRecord?.is_enabled) {
        // MFA enabled - require TOTP verification before session creation
        const mfaSession = await createMfaSession(supabase, user.id);
        if (!mfaSession) {
          return errorResponse("Erro ao iniciar verificação MFA", corsHeaders, 500);
        }
        
        log.info("MFA verification required", { userId: user.id });
        
        return jsonResponse({
          success: false,
          mfa_required: true,
          mfa_session_token: mfaSession.token,
        }, corsHeaders, 200);
      }
      
      // MFA not configured - flag for frontend notification
      // Session will be created normally so user can access /perfil to setup
      mfaSetupRequired = true;
    }
    
    // RISE V3: Resolve session context (SSOT - shared with mfa-verify handler)
    const context = await resolveUserSessionContext({
      supabase,
      user: { id: user.id, email: user.email, name: user.name },
      roles,
      req,
      preferredRole,
    });

    if (!context) {
      return errorResponse("Erro ao criar sessão", corsHeaders, 500);
    }

    log.info("Login successful", {
      userId: user.id,
      activeRole: context.activeRole,
      mfaSetupRequired,
    });

    // Add MFA setup flag if admin/owner hasn't configured MFA yet
    if (mfaSetupRequired) {
      const authCookies = createUnifiedAuthCookies(
        context.session.sessionToken,
        context.session.refreshToken
      );
      return jsonResponseWithCookies({
        success: true,
        mfa_setup_required: true,
        expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
        expiresAt: context.session.accessTokenExpiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        roles,
        activeRole: context.activeRole,
      }, corsHeaders, authCookies);
    }

    return createAuthResponse(context.session, user, roles, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Login error:", msg);
    return errorResponse("Erro ao processar login", corsHeaders, 500);
  }
}
