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
 * Uses X-Producer-Session-Token header exclusively.
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object or null if not authenticated
 */
export async function getAuthenticatedProducer(
  supabase: AnySupabaseClient,
  request: Request
): Promise<ProducerAuth | null> {
  const sessionToken = request.headers.get("X-Producer-Session-Token");
  
  if (!sessionToken) {
    console.log("[unified-auth] No session token provided");
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
    // Get the session
    const { data: session, error } = await supabase
      .from("producer_sessions")
      .select("id, producer_id, expires_at, is_valid")
      .eq("session_token", token)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      console.log("[unified-auth] Invalid or expired session token");
      return null;
    }

    // Get producer profile
    const { data: producer } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("id", session.producer_id)
      .single();

    if (!producer) {
      console.log("[unified-auth] Producer profile not found");
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
