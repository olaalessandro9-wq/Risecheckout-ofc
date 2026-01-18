/**
 * Producer Rate Limit Helper
 * 
 * Rate limiting for producer actions using rate_limit_attempts table.
 * Distinct from buyer rate limiting which uses buyer_rate_limits.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

export interface ProducerRateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

interface RateLimitAttemptRecord {
  id: string;
}

// ============================================
// RATE LIMIT FUNCTIONS
// ============================================

/**
 * Checks if a producer has exceeded rate limits for an action
 * 
 * @param supabase - Supabase client
 * @param producerId - Producer UUID
 * @param action - Action identifier (e.g., "product_settings")
 * @param maxAttempts - Maximum attempts allowed in window (default: 20)
 * @param windowMinutes - Time window in minutes (default: 5)
 */
export async function checkProducerRateLimit(
  supabase: SupabaseClient,
  producerId: string,
  action: string,
  maxAttempts: number = 20,
  windowMinutes: number = 5
): Promise<ProducerRateLimitResult> {
  const windowMs = windowMinutes * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  const { data: attempts } = await supabase
    .from("rate_limit_attempts")
    .select("id")
    .eq("identifier", `producer:${producerId}`)
    .eq("action", action)
    .gte("created_at", windowStart.toISOString());

  const attemptList = (attempts || []) as RateLimitAttemptRecord[];
  
  if (attemptList.length >= maxAttempts) {
    return { 
      allowed: false, 
      retryAfter: windowMinutes * 60 // seconds
    };
  }
  
  return { allowed: true };
}

/**
 * Records a rate limit attempt for a producer action
 * 
 * @param supabase - Supabase client
 * @param producerId - Producer UUID
 * @param action - Action identifier
 */
export async function recordProducerAttempt(
  supabase: SupabaseClient,
  producerId: string,
  action: string
): Promise<void> {
  await supabase.from("rate_limit_attempts").insert({
    identifier: `producer:${producerId}`,
    action,
    success: true,
    created_at: new Date().toISOString(),
  });
}
