/**
 * Handler: get-module-progress
 * Returns progress stats for a single module
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import type { ContentRecord, ProgressWithCompletion } from "../types.ts";

export async function handleGetModuleProgress(
  supabase: SupabaseClient,
  buyerId: string,
  moduleId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!moduleId) {
    return errorResponse("module_id required", corsHeaders, 400);
  }

  // Buscar todos os conteúdos do módulo
  const { data: contents } = await supabase
    .from("product_member_content")
    .select("id")
    .eq("module_id", moduleId)
    .eq("is_active", true) as { data: ContentRecord[] | null };

  if (!contents || contents.length === 0) {
    return successResponse({ 
      progress: { total: 0, completed: 0, percent: 0 }
    }, corsHeaders);
  }

  const contentIds = contents.map(c => c.id);

  // Buscar progresso do buyer
  const { data: progressData } = await supabase
    .from("buyer_content_progress")
    .select("content_id, completed_at")
    .eq("buyer_id", buyerId)
    .in("content_id", contentIds) as { data: ProgressWithCompletion[] | null };

  const completedCount = progressData?.filter(p => p.completed_at).length || 0;
  const percent = Math.round((completedCount / contents.length) * 100);

  return successResponse({ 
    progress: {
      total: contents.length,
      completed: completedCount,
      percent,
    }
  }, corsHeaders);
}
