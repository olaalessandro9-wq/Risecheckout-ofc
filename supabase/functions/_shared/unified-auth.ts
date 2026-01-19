/**
 * Unified Authentication Helper
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * Single authentication mechanism using producer_sessions only.
 * No legacy fallbacks. Clean architecture.
 * 
 * Usage in Edge Functions:
 * ```typescript
 * import { getAuthenticatedProducer, requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
 * 
 * // Optional auth (returns null if not authenticated)
 * const producer = await getAuthenticatedProducer(supabase, req);
 * 
 * // Required auth (throws error if not authenticated)
 * const producer = await requireAuthenticatedProducer(supabase, req);
 * ```
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProducerAccessToken } from "./session-reader.ts";
import { createLogger } from "./logger.ts";

const log = createLogger("UnifiedAuth");

export interface ProducerAuth {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Attempts to authenticate a producer from the request.
 * Uses X-Producer-Session-Token header exclusively.
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object or null if not authenticated
 */
export async function getAuthenticatedProducer(
  supabase: SupabaseClient,
  request: Request
): Promise<ProducerAuth | null> {
  // RISE V3: Read token ONLY from httpOnly cookie (zero legacy code)
  const sessionToken = getProducerAccessToken(request);
  
  if (!sessionToken) {
    log.debug("No session token in cookie");
    return null;
  }

  return validateProducerSessionToken(supabase, sessionToken);
}

/**
 * Requires authentication. Throws error if not authenticated.
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object
 * @throws Error if not authenticated
 */
export async function requireAuthenticatedProducer(
  supabase: SupabaseClient,
  request: Request
): Promise<ProducerAuth> {
  const producer = await getAuthenticatedProducer(supabase, request);
  
  if (!producer) {
    throw new Error("Usuário não autenticado");
  }
  
  return producer;
}

/**
 * Validates a producer session token against the database.
 */
async function validateProducerSessionToken(
  supabase: SupabaseClient,
  token: string
): Promise<ProducerAuth | null> {
  try {
    // Get the session
    const { data: session, error } = await supabase
      .from("producer_sessions")
      .select("id, producer_id, expires_at, is_valid")
      .eq("session_token", token)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      log.debug("Invalid or expired session token");
      return null;
    }

    // Get producer profile
    const { data: producer } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", session.producer_id)
      .single();

    if (!producer) {
      log.debug("Producer profile not found");
      return null;
    }

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", producer.id)
      .single();

    return {
      id: producer.id,
      email: producer.email,
      name: producer.name,
      role: roleData?.role || "user",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Error validating session token:", errorMessage);
    return null;
  }
}

/**
 * Helper to create a standardized unauthorized response.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Usuário não autenticado" }),
    {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
