/**
 * Idempotency Middleware for Payment Edge Functions
 * 
 * RISE Protocol V3 - 10.0/10 Security
 * 
 * Prevents duplicate charges through:
 * 1. Unique idempotency key per request
 * 2. Request hash validation
 * 3. Cached response for idempotent returns
 * 
 * @module _shared/idempotency
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("Idempotency");

// ============================================================================
// TYPES
// ============================================================================

export type PaymentGateway = "mercadopago" | "stripe" | "asaas" | "pushinpay";
export type PaymentMethod = "pix" | "credit_card" | "boleto";
export type AttemptStatus = "pending" | "processing" | "completed" | "failed";

export interface IdempotencyCheckResult {
  /** Whether a new attempt can be started */
  canProceed: boolean;
  /** If false, the cached response to return */
  cachedResponse?: unknown;
  /** If false, whether it's still processing */
  isProcessing?: boolean;
  /** The attempt ID if created/found */
  attemptId?: string;
  /** Error message if any */
  error?: string;
}

export interface IdempotencyOptions {
  orderId: string;
  gateway: PaymentGateway;
  paymentMethod?: PaymentMethod;
  /** Raw request body for hashing */
  requestBody: unknown;
  /** Client IP for audit */
  clientIp?: string;
  /** User agent for audit */
  userAgent?: string;
}

interface PaymentAttemptRecord {
  id: string;
  idempotency_key: string;
  status: AttemptStatus;
  request_hash: string;
  response_data: unknown | null;
  error_data: unknown | null;
  created_at: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generates a deterministic hash from request body.
 * Used to detect inconsistent payloads with the same idempotency key.
 */
async function hashRequest(body: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates an idempotency key from orderId.
 * Format: order_{orderId}_{timestamp}
 * 
 * The frontend should pass a unique key per payment attempt.
 * If not provided, we generate one based on orderId + current second.
 */
export function generateIdempotencyKey(orderId: string, customKey?: string): string {
  if (customKey) return customKey;
  // Fallback: orderId + timestamp (second precision to allow retries)
  const timestamp = Math.floor(Date.now() / 1000);
  return `order_${orderId}_${timestamp}`;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Checks if a payment attempt can proceed or should return cached response.
 * 
 * Returns:
 * - canProceed: true → start processing
 * - canProceed: false, cachedResponse → return this response
 * - canProceed: false, isProcessing → request is being processed, wait
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string,
  options: IdempotencyOptions
): Promise<IdempotencyCheckResult> {
  const requestHash = await hashRequest(options.requestBody);
  
  try {
    // 1. Check for existing attempt
    const { data: existing, error: fetchError } = await supabase
      .from("payment_attempts")
      .select("id, idempotency_key, status, request_hash, response_data, error_data, created_at")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle() as { data: PaymentAttemptRecord | null; error: Error | null };

    if (fetchError) {
      log.error("Error checking idempotency", { error: fetchError.message });
      // Fail open - allow processing but log
      return { canProceed: true, error: fetchError.message };
    }

    // 2. If existing attempt found
    if (existing) {
      log.info("Existing attempt found", { 
        key: idempotencyKey, 
        status: existing.status,
        age: Date.now() - new Date(existing.created_at).getTime()
      });

      // 2a. Check if request hash matches
      if (existing.request_hash !== requestHash) {
        log.warn("Request hash mismatch - different payload with same key", {
          key: idempotencyKey,
          storedHash: existing.request_hash.substring(0, 16),
          newHash: requestHash.substring(0, 16)
        });
        return {
          canProceed: false,
          error: "Idempotency key already used with different request body"
        };
      }

      // 2b. Check status
      switch (existing.status) {
        case "completed":
          log.info("Returning cached response", { key: idempotencyKey });
          return {
            canProceed: false,
            cachedResponse: existing.response_data,
            attemptId: existing.id
          };

        case "failed":
          // Allow retry on failure
          log.info("Previous attempt failed, allowing retry", { key: idempotencyKey });
          return { canProceed: true, attemptId: existing.id };

        case "processing":
          // Check if stale (processing for > 60 seconds = probably crashed)
          const age = Date.now() - new Date(existing.created_at).getTime();
          if (age > 60000) {
            log.warn("Stale processing attempt detected", { key: idempotencyKey, age });
            // Mark as failed and allow retry
            await supabase
              .from("payment_attempts")
              .update({ status: "failed", error_data: { reason: "timeout" } })
              .eq("id", existing.id);
            return { canProceed: true, attemptId: existing.id };
          }
          return {
            canProceed: false,
            isProcessing: true,
            attemptId: existing.id,
            error: "Payment is being processed. Please wait."
          };

        case "pending":
          // Pending for too long = allow takeover
          const pendingAge = Date.now() - new Date(existing.created_at).getTime();
          if (pendingAge > 5000) {
            log.warn("Stale pending attempt", { key: idempotencyKey, pendingAge });
            return { canProceed: true, attemptId: existing.id };
          }
          return {
            canProceed: false,
            isProcessing: true,
            error: "Duplicate request detected. Please wait."
          };
      }
    }

    // 3. No existing attempt - create new one
    const { data: newAttempt, error: insertError } = await supabase
      .from("payment_attempts")
      .insert({
        idempotency_key: idempotencyKey,
        order_id: options.orderId,
        gateway: options.gateway,
        payment_method: options.paymentMethod,
        status: "pending",
        request_hash: requestHash,
        client_ip: options.clientIp,
        user_agent: options.userAgent
      })
      .select("id")
      .single() as { data: { id: string } | null; error: Error | null };

    if (insertError) {
      // Unique constraint violation = race condition, another request won
      if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
        log.info("Race condition detected, checking existing", { key: idempotencyKey });
        // Retry check
        return checkIdempotency(supabase, idempotencyKey, options);
      }
      log.error("Error creating attempt", { error: insertError.message });
      return { canProceed: true, error: insertError.message };
    }

    log.info("New attempt created", { key: idempotencyKey, id: newAttempt?.id });
    return { canProceed: true, attemptId: newAttempt?.id };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Idempotency check failed", { error: msg });
    // Fail open
    return { canProceed: true, error: msg };
  }
}

/**
 * Marks an attempt as processing.
 * Should be called immediately before the actual gateway call.
 */
export async function startProcessing(
  supabase: SupabaseClient,
  attemptId: string
): Promise<void> {
  await supabase
    .from("payment_attempts")
    .update({
      status: "processing",
      processing_started_at: new Date().toISOString()
    })
    .eq("id", attemptId);
}

/**
 * Marks an attempt as completed and caches the response.
 */
export async function completeAttempt(
  supabase: SupabaseClient,
  attemptId: string,
  response: unknown
): Promise<void> {
  await supabase
    .from("payment_attempts")
    .update({
      status: "completed",
      response_data: response,
      completed_at: new Date().toISOString()
    })
    .eq("id", attemptId);
  
  log.info("Attempt completed", { attemptId });
}

/**
 * Marks an attempt as failed.
 */
export async function failAttempt(
  supabase: SupabaseClient,
  attemptId: string,
  error: unknown
): Promise<void> {
  await supabase
    .from("payment_attempts")
    .update({
      status: "failed",
      error_data: { message: error instanceof Error ? error.message : String(error) },
      completed_at: new Date().toISOString()
    })
    .eq("id", attemptId);
  
  log.info("Attempt failed", { attemptId });
}

/**
 * Extracts idempotency key from request headers or body.
 */
export function extractIdempotencyKey(
  req: Request,
  body: { idempotencyKey?: string; orderId?: string }
): string {
  // 1. Check header (preferred)
  const headerKey = req.headers.get("Idempotency-Key") || req.headers.get("X-Idempotency-Key");
  if (headerKey) return headerKey;
  
  // 2. Check body
  if (body.idempotencyKey) return body.idempotencyKey;
  
  // 3. Generate from orderId
  if (body.orderId) return generateIdempotencyKey(body.orderId);
  
  // 4. Fallback to random
  return crypto.randomUUID();
}
