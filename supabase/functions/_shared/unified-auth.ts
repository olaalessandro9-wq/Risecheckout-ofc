/**
 * Unified Authentication Helper (V2 Wrapper)
 * 
 * RISE ARCHITECT PROTOCOL V3 - 100% Migrated
 * 
 * This module wraps unified-auth-v2 as a stable API layer.
 * All authentication now uses the unified `sessions` table exclusively.
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
 * RISE V3: Uses ONLY unified-auth-v2 which validates against the `sessions` table.
 * 
 * Token source: Cookie `__Host-rise_access` (httpOnly)
 * 
 * @param supabase - Supabase client with service role
 * @param request - The incoming HTTP request
 * @returns ProducerAuth object or null if not authenticated
 */
export async function getAuthenticatedProducer(
  supabase: SupabaseClient,
  request: Request
): Promise<ProducerAuth | null> {
  const unifiedToken = getUnifiedAccessToken(request);
  
  if (!unifiedToken) {
    log.debug("No access token found in request");
    return null;
  }
  
  const user = await getAuthenticatedUser(supabase, request);
  if (!user) {
    log.debug("Invalid or expired session");
    return null;
  }
  
  return mapUnifiedUserToProducerAuth(user);
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
 * Maps UnifiedUser to ProducerAuth for stable API layer.
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
