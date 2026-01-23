/**
 * Switch Context Handler - Unified Auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * THE CORE OF THE "NO RE-LOGIN" FEATURE.
 * 
 * Allows users to switch between roles (producer <-> buyer) 
 * without re-authentication. This is what makes the unified
 * identity architecture work like Kiwify/Cakto/Hotmart.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";
import {
  getAuthenticatedUser,
  switchContext,
  unauthorizedResponse,
  type AppRole,
} from "../../_shared/unified-auth-v2.ts";

const log = createLogger("UnifiedAuth:SwitchContext");

interface SwitchContextRequest {
  targetRole: AppRole;
}

export async function handleSwitchContext(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Verify user is authenticated
    const user = await getAuthenticatedUser(supabase, req);
    if (!user) {
      return unauthorizedResponse(corsHeaders);
    }
    
    // Parse request
    const body: SwitchContextRequest = await req.json();
    const { targetRole } = body;
    
    if (!targetRole) {
      return errorResponse("targetRole é obrigatório", corsHeaders, 400);
    }
    
    // Validate target role
    const validRoles: AppRole[] = ["owner", "admin", "user", "seller", "buyer"];
    if (!validRoles.includes(targetRole)) {
      return errorResponse("Role inválida", corsHeaders, 400);
    }
    
    // Check if user already has this role active
    if (user.activeRole === targetRole) {
      return jsonResponse({
        success: true,
        message: "Já está neste contexto",
        activeRole: targetRole,
        availableRoles: user.roles,
      }, corsHeaders);
    }
    
    // Check if user has the requested role
    // Special case: everyone can be a buyer
    if (targetRole !== "buyer" && !user.roles.includes(targetRole)) {
      log.warn("User attempted to switch to unauthorized role", {
        userId: user.id,
        targetRole,
        availableRoles: user.roles,
      });
      return errorResponse("Você não tem permissão para este contexto", corsHeaders, 403);
    }
    
    // Perform the switch
    const result = await switchContext(supabase, req, targetRole);
    
    if (!result.success) {
      return errorResponse(result.error || "Erro ao trocar contexto", corsHeaders, 500);
    }
    
    log.info("Context switched successfully", {
      userId: user.id,
      from: user.activeRole,
      to: targetRole,
    });
    
    return jsonResponse({
      success: true,
      previousRole: user.activeRole,
      activeRole: targetRole,
      availableRoles: user.roles,
    }, corsHeaders);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Switch context error:", msg);
    return errorResponse("Erro ao trocar contexto", corsHeaders, 500);
  }
}
