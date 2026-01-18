/**
 * Buyer Auth Refresh Handler
 * 
 * PHASE 3: Implements refresh token logic for buyers.
 * Allows clients to obtain new access tokens using long-lived refresh tokens.
 * 
 * RISE Protocol V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "./rate-limiting/service.ts";
import { logSecurityEvent, SecurityAction } from "./audit-logger.ts";
import { generateSessionToken, jsonResponse } from "./buyer-auth-password.ts";
import {
  ACCESS_TOKEN_DURATION_MINUTES,
  REFRESH_TOKEN_DURATION_DAYS,
} from "./auth-constants.ts";

// ============================================
// INTERNAL TYPES
// ============================================

interface BuyerSessionWithRefresh {
  id: string;
  buyer_id: string;
  is_valid: boolean;
  refresh_token_expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  buyer: { id: string; email: string; name: string | null; is_active: boolean } |
         { id: string; email: string; name: string | null; is_active: boolean }[];
}

// ============================================
// REFRESH HANDLER
// ============================================

export async function handleRefresh(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { refreshToken } = await req.json();
  const currentIP = getClientIP(req);
  const currentUA = req.headers.get("user-agent");

  if (!refreshToken) {
    return jsonResponse({ error: "Refresh token é obrigatório" }, corsHeaders, 400);
  }

  // Fetch session by refresh token
  const { data: session } = await supabase
    .from("buyer_sessions")
    .select(`
      id, buyer_id, is_valid, refresh_token_expires_at, ip_address, user_agent,
      buyer:buyer_id (id, email, name, is_active)
    `)
    .eq("refresh_token", refreshToken)
    .eq("is_valid", true)
    .single() as { data: BuyerSessionWithRefresh | null; error: unknown };

  if (!session) {
    console.warn("[buyer-auth] Refresh failed - token not found or invalid");
    return jsonResponse({ error: "Refresh token inválido" }, corsHeaders, 401);
  }

  const buyerData = Array.isArray(session.buyer) ? session.buyer[0] : session.buyer;

  if (!buyerData || !buyerData.is_active) {
    return jsonResponse({ error: "Conta desativada" }, corsHeaders, 403);
  }

  // Check refresh token expiration
  if (session.refresh_token_expires_at && new Date(session.refresh_token_expires_at) < new Date()) {
    await supabase.from("buyer_sessions").update({ is_valid: false }).eq("id", session.id);
    console.warn("[buyer-auth] Refresh failed - token expired");
    return jsonResponse({ error: "Refresh token expirado" }, corsHeaders, 401);
  }

  // PHASE 1 Security: Check IP binding
  if (session.ip_address && session.ip_address !== currentIP) {
    console.warn(`[buyer-auth] Refresh blocked - IP mismatch. Session IP: ${session.ip_address}, Current IP: ${currentIP}`);
    await supabase.from("buyer_sessions").update({ is_valid: false }).eq("id", session.id);
    await logSecurityEvent(supabase, {
      userId: buyerData.id,
      action: SecurityAction.LOGIN_FAILED,
      resource: "buyer_auth_refresh_blocked",
      success: false,
      request: req,
      metadata: {
        reason: "ip_mismatch",
        session_ip: session.ip_address,
        current_ip: currentIP,
      }
    });
    return jsonResponse({ error: "Sessão invalidada por segurança" }, corsHeaders, 401);
  }

  // Generate new access token
  const newAccessToken = generateSessionToken();
  const accessTokenExpiresAt = new Date();
  accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + ACCESS_TOKEN_DURATION_MINUTES);

  // Update session with new access token
  const { error: updateError } = await supabase
    .from("buyer_sessions")
    .update({
      session_token: newAccessToken,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateError) {
    console.error("[buyer-auth] Error updating session:", updateError);
    return jsonResponse({ error: "Erro ao renovar token" }, corsHeaders, 500);
  }

  console.log(`[buyer-auth] Token refreshed for buyer: ${buyerData.email}`);

  return jsonResponse({
    success: true,
    accessToken: newAccessToken,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60, // in seconds
    expiresAt: accessTokenExpiresAt.toISOString(),
    buyer: {
      id: buyerData.id,
      email: buyerData.email,
      name: buyerData.name,
    },
  }, corsHeaders, 200);
}

// ============================================
// HELPER: Generate Refresh Token
// ============================================

export function generateRefreshToken(): string {
  const array = new Uint8Array(48); // 96 hex chars for refresh token
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// HELPER: Create Session With Refresh Token
// ============================================

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export function generateSessionTokens(): SessionTokens {
  const accessToken = generateSessionToken();
  const refreshToken = generateRefreshToken();
  
  const accessTokenExpiresAt = new Date();
  accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + ACCESS_TOKEN_DURATION_MINUTES);
  
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + REFRESH_TOKEN_DURATION_DAYS);
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}
