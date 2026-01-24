/**
 * Handler: get_summary
 * Returns full ProgressSummary for dashboard
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "../../_shared/response-helpers.ts";
import type { 
  ContentWithDetails, 
  ModuleWithDetails,
  ModuleProgressStats,
  ProgressRecord 
} from "../types.ts";

export async function handleGetSummary(
  supabase: SupabaseClient,
  buyerId: string,
  productId: string | undefined,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (!productId) {
    return errorResponse("product_id required", corsHeaders, 400);
  }

  // 1. Get all modules for this product
  const { data: modulesData } = await supabase
    .from("product_member_modules")
    .select("id, title, position")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("position");

  const modulesList: ModuleWithDetails[] = modulesData || [];
  const moduleIds = modulesList.map(m => m.id);

  if (moduleIds.length === 0) {
    return new Response(
      JSON.stringify({
        overall: {
          product_id: productId,
          total_modules: 0,
          completed_modules: 0,
          total_contents: 0,
          completed_contents: 0,
          overall_percent: 0,
          total_watch_time_seconds: 0,
          last_accessed_at: null,
          last_content_id: null,
        },
        modules: [],
        recent_contents: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Get all contents for these modules
  const { data: contentsData } = await supabase
    .from("product_member_content")
    .select("id, title, content_type, module_id, duration_seconds, position")
    .in("module_id", moduleIds)
    .eq("is_active", true)
    .order("position");

  const contentsList: ContentWithDetails[] = contentsData || [];
  const contentIds = contentsList.map(c => c.id);

  // 3. Get buyer's progress for all these contents
  const { data: progressData } = await supabase
    .from("buyer_content_progress")
    .select("*")
    .eq("buyer_id", buyerId)
    .in("content_id", contentIds)
    .order("updated_at", { ascending: false });

  const progressList: ProgressRecord[] = progressData || [];
  const progressMap = new Map(progressList.map(p => [p.content_id, p]));

  // 4. Build module progress stats
  const moduleStats: ModuleProgressStats[] = modulesList.map(mod => {
    const moduleContents = contentsList.filter(c => c.module_id === mod.id);
    const completedContents = moduleContents.filter(c => {
      const p = progressMap.get(c.id);
      return p?.completed_at;
    });
    const totalDuration = moduleContents.reduce(
      (sum, c) => sum + (c.duration_seconds || 0), 
      0
    );
    const watchedSeconds = moduleContents.reduce((sum, c) => {
      const p = progressMap.get(c.id);
      return sum + (p?.watch_time_seconds || 0);
    }, 0);

    return {
      module_id: mod.id,
      module_title: mod.title,
      total_contents: moduleContents.length,
      completed_contents: completedContents.length,
      progress_percent: moduleContents.length > 0 
        ? Math.round((completedContents.length / moduleContents.length) * 100) 
        : 0,
      total_duration_seconds: totalDuration,
      watched_seconds: watchedSeconds,
    };
  });

  // 5. Calculate overall stats
  const totalContents = contentsList.length;
  const completedContents = progressList.filter(p => p.completed_at).length;
  const completedModules = moduleStats.filter(m => m.progress_percent === 100).length;
  const totalWatchTime = progressList.reduce(
    (sum, p) => sum + (p.watch_time_seconds || 0), 
    0
  );
  const lastProgress = progressList[0];

  // 6. Build recent_contents with details
  const recentContents = progressList.slice(0, 20).map(p => {
    const content = contentsList.find(c => c.id === p.content_id);
    const mod = modulesList.find(m => m.id === content?.module_id);
    return {
      ...p,
      content_title: content?.title || "Unknown",
      content_type: content?.content_type || "video",
      module_id: content?.module_id || "",
      module_title: mod?.title || "Unknown",
    };
  });

  return new Response(
    JSON.stringify({
      overall: {
        product_id: productId,
        total_modules: modulesList.length,
        completed_modules: completedModules,
        total_contents: totalContents,
        completed_contents: completedContents,
        overall_percent: totalContents > 0 
          ? Math.round((completedContents / totalContents) * 100) 
          : 0,
        total_watch_time_seconds: totalWatchTime,
        last_accessed_at: lastProgress?.updated_at || null,
        last_content_id: lastProgress?.content_id || null,
      },
      modules: moduleStats,
      recent_contents: recentContents,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
