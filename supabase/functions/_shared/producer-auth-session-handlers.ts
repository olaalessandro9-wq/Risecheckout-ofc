/**
 * Producer Auth Session Handlers
 * 
 * Handles logout and validate operations.
 * Extracted from producer-auth-handlers.ts to keep files < 300 lines.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "./rate-limiting/service.ts";
import {
  logAuditEvent,
  jsonResponse,
} from "./producer-auth-helpers.ts";
import {
  getAccessToken,
  createLogoutCookies,
  jsonResponseWithCookies,
} from "./cookie-helper.ts";

import type { ProducerProfile, UserRole } from "./supabase-types.ts";

// ============================================
// INTERNAL TYPES
// ============================================

interface SessionQueryResult {
  producer_id: string;
}

interface SessionWithProducerResult {
  id: string;
  expires_at: string;
  is_valid: boolean;
  producer: ProducerProfile | ProducerProfile[];
}

// ============================================
// LOGOUT HANDLER
// ============================================

export async function handleLogout(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  // RISE V3: Read token ONLY from httpOnly cookie (zero legacy code)
  const sessionToken = getAccessToken(req, "producer");

  if (sessionToken) {
    const { data: session } = await supabase
      .from("producer_sessions")
      .select("producer_id")
      .eq("session_token", sessionToken)
      .single() as { data: SessionQueryResult | null; error: unknown };

    await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);

    if (session?.producer_id) {
      await logAuditEvent(supabase, session.producer_id, "LOGOUT", true, clientIP, userAgent);
    }
  }

  // Clear httpOnly cookies
  const cookies = createLogoutCookies("producer");
  console.log("[producer-auth] Logout successful");
  return jsonResponseWithCookies({ success: true }, corsHeaders, cookies);
}

// ============================================
// VALIDATE HANDLER (PHASE 1: Strict Session Blocking)
// ============================================

interface SessionWithSecurityInfo extends SessionWithProducerResult {
  ip_address: string | null;
  user_agent: string | null;
}

export async function handleValidate(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const currentIP = getClientIP(req);
  const currentUA = req.headers.get("user-agent");

  // RISE V3: Read token ONLY from httpOnly cookie (zero legacy code)
  const sessionToken = getAccessToken(req, "producer");

  if (!sessionToken) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  // RISE V3: Fetch session WITH ip_address and user_agent for strict binding
  const { data: session } = await supabase
    .from("producer_sessions")
    .select(`id, expires_at, is_valid, ip_address, user_agent, producer:producer_id (id, email, name, is_active)`)
    .eq("session_token", sessionToken)
    .single() as { data: SessionWithSecurityInfo | null; error: unknown };

  if (!session || !session.is_valid || !session.producer) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  const producerData = Array.isArray(session.producer) ? session.producer[0] : session.producer;

  if (producerData.is_active === false) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  // Check session expiration
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    return jsonResponse({ valid: false }, corsHeaders);
  }

  // PHASE 1: Strict Session Blocking - Invalidate if IP changes
  if (session.ip_address && session.ip_address !== currentIP) {
    console.warn(`[producer-auth] Session hijack attempt blocked - IP mismatch. Session IP: ${session.ip_address}, Current IP: ${currentIP}`);
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    await logAuditEvent(supabase, producerData.id, "SESSION_HIJACK_BLOCKED", false, currentIP, currentUA, {
      reason: "ip_mismatch",
      session_ip: session.ip_address,
      current_ip: currentIP,
    });
    return jsonResponse({ valid: false, reason: "session_invalidated" }, corsHeaders);
  }

  // PHASE 1: Strict Session Blocking - Invalidate if User-Agent changes
  if (session.user_agent && currentUA && session.user_agent !== currentUA) {
    console.warn(`[producer-auth] Session hijack attempt blocked - UA mismatch for producer: ${producerData.id}`);
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    await logAuditEvent(supabase, producerData.id, "SESSION_HIJACK_BLOCKED", false, currentIP, currentUA, {
      reason: "user_agent_mismatch",
    });
    return jsonResponse({ valid: false, reason: "session_invalidated" }, corsHeaders);
  }

  // Update last activity
  await supabase.from("producer_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", session.id);

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", producerData.id)
    .single() as { data: UserRole | null; error: unknown };

  return jsonResponse({
    valid: true,
    producer: {
      id: producerData.id,
      email: producerData.email,
      name: producerData.name,
      role: roleData?.role || "user",
    },
  }, corsHeaders);
}
