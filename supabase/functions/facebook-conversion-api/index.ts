/**
 * Facebook Conversion API (v2.0.0)
 * 
 * Sends conversion events to Facebook Conversions API (CAPI).
 * Implements SHA-256 hashing for user data as required by Meta.
 * 
 * v2.0.0 Changes (RISE V3):
 * - Supports event_id for Pixel+CAPI deduplication
 * - Retry with exponential backoff (3 attempts: 1s, 2s, 4s)
 * - Differentiates 4xx (no retry) from 5xx (retry)
 * - Persists failed events to failed_facebook_events table
 * - Correct HTTP semantics (errors return proper status codes)
 * - Updated to Meta API v21.0
 * 
 * @category Tracking
 * @status active
 * @version 2.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("facebook-conversion-api");

const FB_API_VERSION = 'v21.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// ============================================================================
// HELPERS
// ============================================================================

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

// ============================================================================
// FAILED EVENT PERSISTENCE
// ============================================================================

async function persistFailedEvent(
  pixelId: string,
  eventName: string,
  eventId: string,
  eventPayload: Record<string, unknown>,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient('general');
    const { error } = await supabase
      .from('failed_facebook_events')
      .insert({
        pixel_id: pixelId,
        event_name: eventName,
        event_id: eventId,
        event_payload: eventPayload,
        error_message: errorMessage,
        status: 'pending',
        retry_count: 0,
      });

    if (error) {
      log.error('Failed to persist event to queue:', error.message);
    } else {
      log.info(`Event persisted to failed_facebook_events queue: ${eventId}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Exception persisting failed event:', msg);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      pixelId,
      accessToken,
      eventName,
      eventId,
      eventData,
      userData,
      testEventCode,
      eventSourceUrl,
    } = await req.json();

    // Validation
    if (!pixelId || !accessToken || !eventName) {
      return new Response(
        JSON.stringify({ error: 'pixelId, accessToken, and eventName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash user data
    const hashedUserData: Record<string, string> = {};
    if (userData?.email) {
      hashedUserData.em = await hashData(userData.email);
    }
    if (userData?.phone) {
      hashedUserData.ph = await hashData(userData.phone);
    }
    if (userData?.firstName) {
      hashedUserData.fn = await hashData(userData.firstName);
    }
    if (userData?.lastName) {
      hashedUserData.ln = await hashData(userData.lastName);
    }
    if (userData?.externalId) {
      hashedUserData.external_id = await hashData(userData.externalId);
    }

    // Build event payload
    const eventPayload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || undefined,
        event_source_url: eventSourceUrl || undefined,
        action_source: 'website',
        user_data: {
          ...hashedUserData,
          client_ip_address: userData?.clientIpAddress,
          client_user_agent: userData?.clientUserAgent,
          fbc: userData?.fbc,
          fbp: userData?.fbp,
        },
        custom_data: {
          currency: eventData?.currency,
          value: eventData?.value,
          content_ids: eventData?.contentIds,
          content_type: eventData?.contentType,
          content_name: eventData?.contentName,
          order_id: eventData?.orderId,
          num_items: eventData?.numItems,
        },
      }],
      ...(testEventCode && { test_event_code: testEventCode }),
    };

    // Send to Facebook with retry
    const fbUrl = `${FB_API_BASE}/${pixelId}/events?access_token=${accessToken}`;
    let lastError = '';
    let lastStatus = 0;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const fbResponse = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventPayload),
        });

        const fbResult = await fbResponse.json();
        lastStatus = fbResponse.status;

        if (fbResponse.ok) {
          log.info(`✅ Event ${eventName} sent to pixel ${pixelId}`, {
            eventId,
            attempt: attempt + 1,
          });

          return new Response(
            JSON.stringify({ success: true, result: fbResult, eventId }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Non-retryable error (4xx except 429)
        if (!isRetryableStatus(fbResponse.status)) {
          lastError = JSON.stringify(fbResult);
          log.error(`Non-retryable FB API error (${fbResponse.status}):`, fbResult);
          break;
        }

        // Retryable error - wait and retry
        lastError = JSON.stringify(fbResult);
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        log.warn(`Retryable error (${fbResponse.status}), retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
        await sleep(delay);

      } catch (fetchError) {
        const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        lastError = errMsg;
        log.warn(`Network error on attempt ${attempt + 1}: ${errMsg}`);

        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    // All retries exhausted - persist to failed events queue
    if (eventId) {
      await persistFailedEvent(pixelId, eventName, eventId, eventPayload, lastError);
    }

    log.error(`All ${MAX_RETRIES} retries exhausted for ${eventName} on pixel ${pixelId}`, {
      eventId,
      lastError,
      lastStatus,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: lastError,
        eventId,
        persistedToQueue: !!eventId,
      }),
      {
        status: lastStatus >= 400 ? lastStatus : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Unhandled error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
