/**
 * Handler: update
 * Updates progress for a content item
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import type { ProgressData, ExistingProgress } from "../types.ts";

export async function handleUpdate(
  supabase: SupabaseClient,
  buyerId: string,
  contentId: string | undefined,
  data: ProgressData | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!contentId || !data) {
    return errorResponse("content_id and data required", corsHeaders, 400);
  }

  const updateData: Record<string, unknown> = {
    content_id: contentId,
    buyer_id: buyerId,
    updated_at: new Date().toISOString(),
  };

  if (data.progress_percent !== undefined) {
    updateData.progress_percent = Math.min(100, Math.max(0, data.progress_percent));
  }
  if (data.last_position_seconds !== undefined) {
    updateData.last_position_seconds = data.last_position_seconds;
  }
  if (data.watch_time_seconds !== undefined) {
    updateData.watch_time_seconds = data.watch_time_seconds;
  }

  // Marcar started_at se for primeira vez
  const { data: existing } = await supabase
    .from("buyer_content_progress")
    .select("id, started_at")
    .eq("content_id", contentId)
    .eq("buyer_id", buyerId)
    .single() as { data: ExistingProgress | null };

  if (!existing) {
    updateData.started_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("buyer_content_progress")
    .upsert(updateData, {
      onConflict: "buyer_id,content_id",
    });

  if (error) throw error;

  return successResponse({ success: true }, corsHeaders);
}
