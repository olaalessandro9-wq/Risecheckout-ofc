/**
 * Unified Authentication Helper
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * This helper provides a single authentication mechanism that accepts:
 * 1. X-Producer-Session-Token header (new producer_sessions system)
 * 2. Authorization: Bearer JWT (legacy Supabase Auth - fallback)
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

export interface ProducerAuth {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = any;

/**
 * Attempts to authenticate a producer from the request.
 * Tries producer_session_token first, then falls back to JWT.
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object or null if not authenticated
 */
export async function getAuthenticatedProducer(
  supabase: AnySupabaseClient,
  request: Request
): Promise<ProducerAuth | null> {
  // 1. Try X-Producer-Session-Token header (new system)
  const sessionToken = request.headers.get("X-Producer-Session-Token");
  
  if (sessionToken) {
    const producer = await validateProducerSessionToken(supabase, sessionToken);
    if (producer) {
      return producer;
    }
  }

  // 2. Try to extract from request body (for legacy compatibility)
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.json().catch(() => ({}));
    
    if (body.sessionToken) {
      const producer = await validateProducerSessionToken(supabase, body.sessionToken);
      if (producer) {
        return producer;
      }
    }
  } catch {
    // Body parsing failed, continue to JWT fallback
  }

  // 3. Fallback: Authorization Bearer JWT (legacy Supabase Auth)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const producer = await validateJWT(supabase, token);
    if (producer) {
      return producer;
    }
  }

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
  supabase: AnySupabaseClient,
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
  supabase: AnySupabaseClient,
  token: string
): Promise<ProducerAuth | null> {
  try {
    // First get the session
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

    // Then get producer profile
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
  } catch (error) {
    console.error("[unified-auth] Error validating session token:", error);
    return null;
  }
}

/**
 * Validates a JWT token via Supabase Auth (legacy fallback).
 */
async function validateJWT(
  supabase: AnySupabaseClient,
  token: string
): Promise<ProducerAuth | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get profile info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      name: profile?.name || null,
      role: roleData?.role || "user",
    };
  } catch (error) {
    console.error("[unified-auth] Error validating JWT:", error);
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
