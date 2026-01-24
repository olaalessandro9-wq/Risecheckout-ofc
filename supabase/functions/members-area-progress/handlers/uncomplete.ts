/**
 * Handler: uncomplete
 * Unmarks a content as completed (toggle off)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("progress-uncomplete");

export async function handleUncomplete(
  supabase: SupabaseClient,
  buyerId: string,
  contentId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!contentId) {
    return errorResponse("content_id required", corsHeaders, 400);
  }

  const { error } = await supabase
    .from("buyer_content_progress")
    .update({
      progress_percent: 0,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("content_id", contentId)
    .eq("buyer_id", buyerId);

  if (error) throw error;

  log.info(`Content ${contentId} uncompleted by buyer ${buyerId}`);

  return successResponse({ success: true }, corsHeaders);
}
