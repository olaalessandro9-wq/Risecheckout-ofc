/**
 * Unified Authentication Helper (V2 Wrapper)
 * 
 * RISE ARCHITECT PROTOCOL V3 - Security Fix
 * 
 * This module now wraps unified-auth-v2 to ensure all Edge Functions
 * use the new unified session system while maintaining backwards compatibility.
 * 
 * The wrapper approach allows 53+ Edge Functions to work correctly
 * without individual modification.
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
import { createLogger } from "./logger.ts";
import { 
  getAuthenticatedUser,
  requireAuthenticatedUser,
  type UnifiedUser,
  getUnifiedAccessToken,
} from "./unified-auth-v2.ts";
import { getProducerAccessToken as getLegacyProducerToken } from "./session-reader.ts";

const log = createLogger("UnifiedAuth");

export interface ProducerAuth {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Attempts to authenticate a producer from the request.
 * 
 * SECURITY FIX: Now uses unified-auth-v2 internally which validates
 * against the `sessions` table (new) instead of `producer_sessions` (legacy).
 * 
 * Token priority:
 * 1. __Host-rise_access (unified - new)
 * 2. __Host-producer_access (legacy fallback)
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object or null if not authenticated
 */
export async function getAuthenticatedProducer(
  supabase: SupabaseClient,
  request: Request
): Promise<ProducerAuth | null> {
  // First, try the unified auth system (new sessions table)
  const unifiedToken = getUnifiedAccessToken(request);
  
  if (unifiedToken) {
    const user = await getAuthenticatedUser(supabase, request);
    if (user) {
      return mapUnifiedUserToProducerAuth(user);
    }
  }
  
  // Fallback to legacy system for old sessions still active
  const legacyToken = getLegacyProducerToken(request);
  if (legacyToken) {
    const legacyAuth = await validateLegacyProducerSession(supabase, legacyToken);
    if (legacyAuth) {
      log.debug("Using legacy producer_sessions auth");
      return legacyAuth;
    }
  }
  
  log.debug("No valid session found in either system");
  return null;
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
 * Maps UnifiedUser to ProducerAuth for backwards compatibility.
 */
function mapUnifiedUserToProducerAuth(user: UnifiedUser): ProducerAuth {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.activeRole,
  };
}

/**
 * Validates a legacy producer session token against producer_sessions table.
 * Used as fallback for sessions created before the unified auth migration.
 */
async function validateLegacyProducerSession(
  supabase: SupabaseClient,
  token: string
): Promise<ProducerAuth | null> {
  try {
    // Get the session from legacy table
    const { data: session, error } = await supabase
      .from("producer_sessions")
      .select("id, producer_id, expires_at, is_valid")
      .eq("session_token", token)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      return null;
    }

    // Get producer profile from legacy profiles table
    const { data: producer } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", session.producer_id)
      .single();

    if (!producer) {
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
    log.error("Error validating legacy session token:", errorMessage);
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
