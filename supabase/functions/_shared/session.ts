/**
 * Producer Session Validation
 * 
 * @deprecated ENTIRE MODULE DEPRECATED - Use unified-auth.ts instead
 * 
 * RISE Protocol V3: This module exists only for backward compatibility.
 * All new Edge Functions MUST use unified-auth.ts for authentication.
 * 
 * Migration guide:
 * ```typescript
 * // OLD (deprecated):
 * import { validateProducerSession } from "../_shared/session.ts";
 * const result = await validateProducerSession(supabase, token);
 * 
 * // NEW (RISE V3 compliant):
 * import { getAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
 * const producer = await getAuthenticatedProducer(supabase, req);
 * if (!producer) return unauthorizedResponse(corsHeaders);
 * ```
 * 
 * @version DEPRECATED
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SessionValidationResult {
  valid: boolean;
  producerId?: string;
  error?: string;
}

/**
 * @deprecated Use `getAuthenticatedProducer` from `unified-auth.ts` instead.
 */
export async function validateProducerSession(
  _supabase: SupabaseClient,
  _sessionToken: string
): Promise<SessionValidationResult> {
  console.warn("[DEPRECATED] session.ts is deprecated - Use unified-auth.ts");
  return { valid: false, error: "DEPRECATED: Use unified-auth.ts" };
}

/**
 * @deprecated Use request headers directly with unified-auth.ts
 */
export function extractSessionToken(_req: Request, _body?: Record<string, unknown>): string {
  console.warn("[DEPRECATED] extractSessionToken is deprecated - Use unified-auth.ts");
  return "";
}
