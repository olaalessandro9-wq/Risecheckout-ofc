/**
 * Buyer Auth Refresh Handler
 * 
 * PHASE 3: Implements refresh token logic for buyers.
 * 
 * ENHANCED: Refresh Token Rotation with Theft Detection
 * ENHANCED: httpOnly Cookies for XSS protection
 * 
 * RISE Protocol V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "./rate-limiting/service.ts";
import { logSecurityEvent, SecurityAction } from "./audit-logger.ts";
import { generateSessionToken } from "./buyer-auth-password.ts";
import {
  ACCESS_TOKEN_DURATION_MINUTES,
  REFRESH_TOKEN_DURATION_DAYS,
} from "./auth-constants.ts";
import {
  getRefreshToken,
  createAuthCookies,
  jsonResponseWithCookies,
} from "./cookie-helper.ts";
import { errorResponse } from "./response-helpers.ts";

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

interface ReusedTokenSession {
  id: string;
  buyer_id: string;
}

// ============================================
// REFRESH HANDLER
// ============================================

export async function handleRefresh(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const currentIP = getClientIP(req);
  const currentUA = req.headers.get("user-agent");

  // Try to get refresh token from cookie first, then body
  let refreshToken = getRefreshToken(req, "buyer");
  
  // Fallback: try to read from body (legacy)
  if (!refreshToken) {
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } catch {
      // No body provided
    }
  }

  if (!refreshToken) {
    return errorResponse("Refresh token é obrigatório", corsHeaders, 400);
  }

  // ============================================
  // THEFT DETECTION: Check if token was already rotated
  // ============================================
  const { data: reusedSession } = await supabase
    .from("buyer_sessions")
    .select("id, buyer_id")
    .eq("previous_refresh_token", refreshToken)
    .single() as { data: ReusedTokenSession | null; error: unknown };

  if (reusedSession) {
    // TOKEN REUSE DETECTED = POSSIBLE THEFT
    console.error("[SECURITY] Buyer refresh token reuse detected! Possible theft. Buyer:", reusedSession.buyer_id);
    
    // Invalidate ALL sessions for this buyer
    await supabase
      .from("buyer_sessions")
      .update({ is_valid: false })
      .eq("buyer_id", reusedSession.buyer_id);

    // Log security event
    await logSecurityEvent(supabase, {
      userId: reusedSession.buyer_id,
      action: SecurityAction.LOGIN_FAILED,
      resource: "buyer_auth_token_theft_detected",
      success: false,
      request: req,
      metadata: {
        reason: "refresh_token_reuse",
        reused_token_prefix: refreshToken.substring(0, 8),
        action_taken: "all_sessions_invalidated",
      }
    });

    return errorResponse("Sessão comprometida. Faça login novamente.", corsHeaders, 401);
  }

  // ============================================
  // NORMAL FLOW: Fetch session by current refresh token
  // ============================================
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
    return errorResponse("Refresh token inválido", corsHeaders, 401);
  }

  const buyerData = Array.isArray(session.buyer) ? session.buyer[0] : session.buyer;

  if (!buyerData || !buyerData.is_active) {
    return errorResponse("Conta desativada", corsHeaders, 403);
  }

  // Check refresh token expiration
  if (session.refresh_token_expires_at && new Date(session.refresh_token_expires_at) < new Date()) {
    await supabase.from("buyer_sessions").update({ is_valid: false }).eq("id", session.id);
    return errorResponse("Refresh token expirado", corsHeaders, 401);
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
      },
    });
    return errorResponse("Sessão invalidada por segurança", corsHeaders, 401);
  }

  // ============================================
  // TOKEN ROTATION: Generate NEW tokens
  // ============================================
  const newAccessToken = generateSessionToken();
  const newRefreshToken = generateRefreshToken();

  const accessTokenExpiresAt = new Date();
  accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + ACCESS_TOKEN_DURATION_MINUTES);

  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + REFRESH_TOKEN_DURATION_DAYS);

  // Update session with ROTATED tokens
  const { error: updateError } = await supabase
    .from("buyer_sessions")
    .update({
      session_token: newAccessToken,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      refresh_token: newRefreshToken,
      refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
      previous_refresh_token: refreshToken, // Store old token for theft detection
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateError) {
    return errorResponse("Erro ao renovar token", corsHeaders, 500);
  }

  console.log(`[buyer-auth] Token rotated for buyer: ${buyerData.email}`);

  // RISE V3: Set httpOnly cookies for tokens (XSS protection)
  const cookies = createAuthCookies("buyer", newAccessToken, newRefreshToken);

  return jsonResponseWithCookies({
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60,
    expiresAt: accessTokenExpiresAt.toISOString(),
    buyer: {
      id: buyerData.id,
      email: buyerData.email,
      name: buyerData.name,
    },
  }, corsHeaders, cookies);
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
