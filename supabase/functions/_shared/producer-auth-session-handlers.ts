/**
 * Producer Auth Session Handlers
 * 
 * Handles logout and validate operations.
 * Extracted from producer-auth-handlers.ts to keep files < 300 lines.
 * 
 * RISE Protocol Compliant - Zero `any`
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "./rate-limiter.ts";
import {
  logAuditEvent,
  jsonResponse,
} from "./producer-auth-helpers.ts";

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
  const { sessionToken } = await req.json();
  const clientIP = getClientIP(req);
  const userAgent = req.headers.get("user-agent");

  if (!sessionToken) {
    return jsonResponse({ success: false, error: "Token de sessão é obrigatório" }, corsHeaders, 400);
  }

  const { data: session } = await supabase
    .from("producer_sessions")
    .select("producer_id")
    .eq("session_token", sessionToken)
    .single() as { data: SessionQueryResult | null; error: unknown };

  await supabase.from("producer_sessions").update({ is_valid: false }).eq("session_token", sessionToken);

  if (session?.producer_id) {
    await logAuditEvent(supabase, session.producer_id, "LOGOUT", true, clientIP, userAgent);
  }

  console.log("[producer-auth] Logout successful");
  return jsonResponse({ success: true }, corsHeaders);
}

// ============================================
// VALIDATE HANDLER
// ============================================

export async function handleValidate(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sessionToken } = await req.json();

  if (!sessionToken) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  const { data: session } = await supabase
    .from("producer_sessions")
    .select(`id, expires_at, is_valid, producer:producer_id (id, email, name, is_active)`)
    .eq("session_token", sessionToken)
    .single() as { data: SessionWithProducerResult | null; error: unknown };

  if (!session || !session.is_valid || !session.producer) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  const producerData = Array.isArray(session.producer) ? session.producer[0] : session.producer;

  if (producerData.is_active === false) {
    return jsonResponse({ valid: false }, corsHeaders);
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("producer_sessions").update({ is_valid: false }).eq("id", session.id);
    return jsonResponse({ valid: false }, corsHeaders);
  }

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
