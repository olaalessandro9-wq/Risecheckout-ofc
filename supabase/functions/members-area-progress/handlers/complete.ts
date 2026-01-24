/**
 * Handler: complete
 * Marks a content as completed
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("progress-complete");

export async function handleComplete(
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
    .upsert({
      content_id: contentId,
      buyer_id: buyerId,
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "buyer_id,content_id",
    });

  if (error) throw error;

  log.info(`Content ${contentId} completed by buyer ${buyerId}`);

  return successResponse({ success: true }, corsHeaders);
}
