/**
 * Reprocess Failed Facebook Events
 * 
 * Cron function that reprocesses failed Facebook CAPI events.
 * Runs hourly, picks up to 50 pending events, retries each.
 * After 10 total failures, marks as permanently failed.
 * Also cleans up old successful/failed events.
 * 
 * @category Tracking
 * @status active
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("reprocess-failed-fb-events");

const FB_API_VERSION = 'v21.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate internal call via CRON_SECRET or Authorization
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also accept service role key
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const supabase = getSupabaseClient('general');

    // 1. Fetch pending events via RPC
    const { data: pendingEvents, error: fetchError } = await supabase
      .rpc('get_pending_failed_facebook_events', { p_limit: 50 });

    if (fetchError) {
      log.error('Error fetching pending events:', fetchError.message);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingEvents || pendingEvents.length === 0) {
      log.info('No pending events to reprocess');

      // Still run cleanup
      await runCleanup(supabase);

      return new Response(
        JSON.stringify({ success: true, processed: 0, cleaned: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Found ${pendingEvents.length} pending event(s) to reprocess`);

    let successCount = 0;
    let failCount = 0;

    // 2. Process each event
    for (const event of pendingEvents) {
      const success = await reprocessEvent(event);

      // 3. Mark result via RPC
      const { error: markError } = await supabase
        .rpc('mark_facebook_event_reprocessed', {
          p_event_id: event.id,
          p_success: success,
        });

      if (markError) {
        log.error(`Error marking event ${event.id}:`, markError.message);
      }

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 4. Cleanup old events
    await runCleanup(supabase);

    log.info(`Reprocessing complete: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingEvents.length,
        successCount,
        failCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

/**
 * Reprocesses a single failed event by sending directly to Meta API
 */
async function reprocessEvent(event: {
  pixel_id: string;
  event_id: string;
  event_payload: { data: unknown[]; test_event_code?: string };
}): Promise<boolean> {
  try {
    // We need the access_token from the original payload or from vendor_pixels
    // The event_payload contains the full payload that was originally sent to Meta
    const supabase = getSupabaseClient('general');

    // Fetch the access token from vendor_pixels
    const { data: pixelData } = await supabase
      .from('vendor_pixels')
      .select('access_token')
      .eq('pixel_id', event.pixel_id)
      .eq('platform', 'facebook')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!pixelData?.access_token) {
      log.warn(`No active access token found for pixel ${event.pixel_id}`);
      return false;
    }

    const fbUrl = `${FB_API_BASE}/${event.pixel_id}/events?access_token=${pixelData.access_token}`;

    const response = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.event_payload),
    });

    if (response.ok) {
      log.info(`✅ Successfully reprocessed event ${event.event_id} for pixel ${event.pixel_id}`);
      return true;
    }

    const errorBody = await response.text();
    log.warn(`Reprocess failed for ${event.event_id}: HTTP ${response.status} - ${errorBody.slice(0, 200)}`);
    return false;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Exception reprocessing event ${event.event_id}:`, msg);
    return false;
  }
}

/**
 * Cleans up old events from the queue
 */
async function runCleanup(supabase: ReturnType<typeof getSupabaseClient>): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_failed_facebook_events');
    if (error) {
      log.warn('Cleanup error:', error.message);
    } else if (data && data > 0) {
      log.info(`Cleaned up ${data} old event(s)`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn('Cleanup exception:', msg);
  }
}
