/**
 * Producer Session Validation
 * 
 * Centralizes session validation logic for all Edge Functions
 * that require producer authentication.
 * 
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SessionValidationResult {
  valid: boolean;
  producerId?: string;
  error?: string;
}

interface SessionRecord {
  producer_id: string;
  expires_at: string;
  is_valid: boolean;
}

/**
 * Validates a producer session token
 * 
 * @param supabase - Supabase client with service role
 * @param sessionToken - The session token from x-producer-session-token header
 * @returns Validation result with producerId if valid
 */
export async function validateProducerSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<SessionValidationResult> {
  if (!sessionToken) {
    return { valid: false, error: "Token de sessão não fornecido" };
  }

  const { data: session, error } = await supabase
    .from("producer_sessions")
    .select("producer_id, expires_at, is_valid")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return { valid: false, error: "Sessão inválida" };
  }

  const sessionRecord = session as SessionRecord;

  if (!sessionRecord.is_valid) {
    return { valid: false, error: "Sessão expirada ou invalidada" };
  }

  if (new Date(sessionRecord.expires_at) < new Date()) {
    // Mark as invalid
    await supabase
      .from("producer_sessions")
      .update({ is_valid: false })
      .eq("session_token", sessionToken);
    return { valid: false, error: "Sessão expirada" };
  }

  // Update last activity
  await supabase
    .from("producer_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("session_token", sessionToken);

  return { valid: true, producerId: sessionRecord.producer_id };
}

/**
 * Extracts session token from request (header or body)
 */
export function extractSessionToken(req: Request, body?: Record<string, unknown>): string {
  return (body?.sessionToken as string) || req.headers.get("x-producer-session-token") || "";
}
