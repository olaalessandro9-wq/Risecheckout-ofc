/**
 * Handler: get-product-progress
 * Returns progress stats for entire product
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse, successResponse } from "../../_shared/response-helpers.ts";
import type { 
  ModuleRecord, 
  ContentWithModule, 
  ProgressWithCompletion,
  ModuleProgress 
} from "../types.ts";

export async function handleGetProductProgress(
  supabase: SupabaseClient,
  buyerId: string,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId) {
    return errorResponse("product_id required", corsHeaders, 400);
  }

  // Buscar todos os módulos do produto
  const { data: modules } = await supabase
    .from("product_member_modules")
    .select("id")
    .eq("product_id", productId)
    .eq("is_active", true) as { data: ModuleRecord[] | null };

  if (!modules || modules.length === 0) {
    return successResponse({ 
      progress: { total: 0, completed: 0, percent: 0, modules: [] }
    }, corsHeaders);
  }

  const moduleIds = modules.map(m => m.id);

  const { data: contents } = await supabase
    .from("product_member_content")
    .select("id, module_id")
    .in("module_id", moduleIds)
    .eq("is_active", true) as { data: ContentWithModule[] | null };

  if (!contents || contents.length === 0) {
    return successResponse({ 
      progress: { total: 0, completed: 0, percent: 0, modules: [] }
    }, corsHeaders);
  }

  const contentIds = contents.map(c => c.id);

  // Buscar progresso
  const { data: progressData } = await supabase
    .from("buyer_content_progress")
    .select("content_id, completed_at")
    .eq("buyer_id", buyerId)
    .in("content_id", contentIds) as { data: ProgressWithCompletion[] | null };

  const completedSet = new Set(
    progressData?.filter(p => p.completed_at).map(p => p.content_id) || []
  );

  // Calcular por módulo
  const moduleProgress: Record<string, ModuleProgress> = {};
  for (const content of contents) {
    if (!moduleProgress[content.module_id]) {
      moduleProgress[content.module_id] = { total: 0, completed: 0 };
    }
    moduleProgress[content.module_id].total++;
    if (completedSet.has(content.id)) {
      moduleProgress[content.module_id].completed++;
    }
  }

  const totalContents = contents.length;
  const completedContents = completedSet.size;
  const overallPercent = Math.round((completedContents / totalContents) * 100);

  return successResponse({ 
    progress: {
      total: totalContents,
      completed: completedContents,
      percent: overallPercent,
      modules: Object.entries(moduleProgress).map(([id, p]) => ({
        module_id: id,
        total: p.total,
        completed: p.completed,
        percent: Math.round((p.completed / p.total) * 100),
      })),
    }
  }, corsHeaders);
}
