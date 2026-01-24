/**
 * Handler: get_content / get
 * Returns ContentProgress for a specific content
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "../../_shared/response-helpers.ts";
import type { ProgressRecord } from "../types.ts";

export async function handleGetContent(
  supabase: SupabaseClient,
  buyerId: string,
  contentId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!contentId) {
    return errorResponse("content_id required", corsHeaders, 400);
  }

  const { data: progress } = await supabase
    .from("buyer_content_progress")
    .select("*")
    .eq("content_id", contentId)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  // Return ContentProgress shape directly (not wrapped)
  const result: ProgressRecord = progress || {
    id: "",
    buyer_id: buyerId,
    content_id: contentId,
    progress_percent: 0,
    watch_time_seconds: 0,
    last_position_seconds: null,
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
