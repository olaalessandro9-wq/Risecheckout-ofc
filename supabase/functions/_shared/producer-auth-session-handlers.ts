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
import { createLogger } from "./logger.ts";

import type { ProducerProfile, UserRole } from "./supabase-types.ts";

const log = createLogger("ProducerAuthSession");

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
  log.info("Logout successful");
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

  // ============================================
  // DEVICE TRUST SYSTEM (RISE V3 - 2026-01-20)
  // ============================================
  // IP/UA changes are LOGGED but do NOT invalidate session.
  // Rationale:
  // - Dynamic IPs are common (mobile, ISP reassignment)
  // - User-Agents change with browser updates, extensions, etc.
  // - Security is maintained via refresh token rotation + theft detection
  // ============================================

  if (session.ip_address && session.ip_address !== currentIP) {
    // Log IP change for audit purposes only (no session invalidation)
    log.info(`IP change detected for producer: ${producerData.id}. Old: ${session.ip_address}, New: ${currentIP}`);
    await logAuditEvent(supabase, producerData.id, "IP_CHANGE_DETECTED", true, currentIP, currentUA, {
      previous_ip: session.ip_address,
      current_ip: currentIP,
      action: "session_continued",
    });
  }

  // NOTE: User-Agent binding REMOVED entirely (RISE V3).
  // UA is unreliable: changes with browser updates, extensions, CDN normalization.
  // Theft detection via refresh token rotation is the authoritative mechanism.

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
