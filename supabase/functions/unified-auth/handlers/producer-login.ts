/**
 * Producer Login Handler (as Buyer)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Allows producers to login as buyers to access their own members area.
 * Creates a session with 'buyer' role context.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import {
  createSession,
  createAuthResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";

const log = createLogger("UnifiedAuth:ProducerLogin");

interface ProducerLoginRequest {
  email: string;
}

export async function handleProducerLogin(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: ProducerLoginRequest = await req.json();
    const { email } = body;
    
    if (!email) {
      return errorResponse("Email é obrigatório", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user in unified users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, is_active")
      .eq("email", normalizedEmail)
      .single();
    
    if (userError || !user) {
      log.info(`Producer login failed - user not found: ${normalizedEmail}`);
      return errorResponse("Perfil não encontrado", corsHeaders, 404);
    }
    
    if (!user.is_active) {
      return errorResponse("Conta desativada", corsHeaders, 403);
    }
    
    // Create session with buyer context (producers accessing as students)
    const session = await createSession(supabase, user.id, "buyer", req);
    if (!session) {
      return errorResponse("Erro ao criar sessão", corsHeaders, 500);
    }
    
    // Get user roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const roles: AppRole[] = (userRoles || []).map(r => r.role as AppRole);
    
    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);
    
    log.info(`Producer login successful: ${normalizedEmail}`);
    
    return createAuthResponse(session, user, roles, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Producer login error:", msg);
    return errorResponse("Erro ao processar login", corsHeaders, 500);
  }
}
