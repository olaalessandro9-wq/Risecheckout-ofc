/**
 * Producer Auth Refresh Handler
 * 
 * PHASE 3: Implements refresh token logic for producers.
 * Allows clients to obtain new access tokens using long-lived refresh tokens.
 * 
 * RISE Protocol V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "./rate-limiting/service.ts";
import { logAuditEvent, generateSessionToken } from "./producer-auth-helpers.ts";
import { jsonResponse, errorResponse } from "./response-helpers.ts";
import {
  ACCESS_TOKEN_DURATION_MINUTES,
  REFRESH_TOKEN_DURATION_DAYS,
} from "./auth-constants.ts";

import type { ProducerProfile, UserRole } from "./supabase-types.ts";

// ============================================
// INTERNAL TYPES
// ============================================

interface RefreshSessionResult {
  id: string;
  producer_id: string;
  is_valid: boolean;
  refresh_token_expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  producer: ProducerProfile | ProducerProfile[];
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
    return errorResponse("Refresh token é obrigatório", corsHeaders, 400);
  }

  // Fetch session by refresh token
  const { data: session } = await supabase
    .from("producer_sessions")
    .select(`
      id, producer_id, is_valid, refresh_token_expires_at, ip_address, user_agent,
      producer:producer_id (id, email, name, is_active)
    `)
    .eq("refresh_token", refreshToken)
    .eq("is_valid", true)
    .single() as { data: RefreshSessionResult | null; error: unknown };

  if (!session) {
    console.warn("[producer-auth] Refresh failed - token not found or invalid");
    return errorResponse("Refresh token inválido", corsHeaders, 401);
  }

  const producerData = Array.isArray(session.producer) ? session.producer[0] : session.producer;

  if (!producerData || producerData.is_active === false) {
    return errorResponse("Conta desativada", corsHeaders, 403);
  }

  // Check refresh token expiration
  if (session.refresh_token_expires_at && new Date(session.refresh_token_expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    console.warn("[producer-auth] Refresh failed - token expired");
    return errorResponse("Refresh token expirado", corsHeaders, 401);
  }

  // PHASE 1 Security: Check IP binding
  if (session.ip_address && session.ip_address !== currentIP) {
    console.warn(`[producer-auth] Refresh blocked - IP mismatch. Session IP: ${session.ip_address}, Current IP: ${currentIP}`);
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    await logAuditEvent(supabase, producerData.id, "REFRESH_BLOCKED_IP", false, currentIP, currentUA, {
      reason: "ip_mismatch",
      session_ip: session.ip_address,
      current_ip: currentIP,
    });
    return errorResponse("Sessão invalidada por segurança", corsHeaders, 401);
  }

  // Generate new access token
  const newAccessToken = generateSessionToken();
  const accessTokenExpiresAt = new Date();
  accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + ACCESS_TOKEN_DURATION_MINUTES);

  // Update session with new access token
  const { error: updateError } = await supabase
    .from("producer_sessions")
    .update({
      session_token: newAccessToken,
      access_token_expires_at: accessTokenExpiresAt.toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateError) {
    console.error("[producer-auth] Error updating session:", updateError);
    return errorResponse("Erro ao renovar token", corsHeaders, 500);
  }

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerData.id)
    .single() as { data: UserRole | null; error: unknown };

  console.log(`[producer-auth] Token refreshed for producer: ${producerData.email}`);

  return jsonResponse({
    success: true,
    accessToken: newAccessToken,
    expiresIn: ACCESS_TOKEN_DURATION_MINUTES * 60, // in seconds
    expiresAt: accessTokenExpiresAt.toISOString(),
    producer: {
      id: producerData.id,
      email: producerData.email,
      name: producerData.name,
      role: roleData?.role || "user",
    },
  }, corsHeaders);
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
