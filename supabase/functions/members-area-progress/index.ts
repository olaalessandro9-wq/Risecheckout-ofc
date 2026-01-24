/**
 * members-area-progress - Gerenciamento de progresso de conteúdo
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant (Unified Auth)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { 
  rateLimitMiddleware, 
  MEMBERS_AREA,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";
import { getAuthenticatedUser } from "../_shared/unified-auth-v2.ts";

const log = createLogger("members-area-progress");

// === INTERFACES (Zero any) ===

interface ProgressData {
  progress_percent?: number;
  last_position_seconds?: number;
  watch_time_seconds?: number;
}

interface ProgressRequest {
  action: "get" | "get_content" | "get_summary" | "get_last_watched" | "update" | "complete" | "uncomplete" | "get-module-progress" | "get-product-progress";
  content_id?: string;
  module_id?: string;
  product_id?: string;
  buyer_id?: string;
  data?: ProgressData;
}

interface ProgressRecord {
  progress_percent: number;
  last_position_seconds: number;
  watch_time_seconds: number;
  completed_at: string | null;
}

interface ExistingProgress {
  id: string;
  started_at: string | null;
}

interface ContentRecord {
  id: string;
}

interface ModuleRecord {
  id: string;
}

interface ContentWithModule {
  id: string;
  module_id: string;
}

interface ProgressWithCompletion {
  content_id: string;
  completed_at: string | null;
}

interface ModuleProgress {
  total: number;
  completed: number;
}

// === MAIN HANDLER ===

Deno.serve(async (req) => {
  // CORS V2 handler
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      MEMBERS_AREA,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: ProgressRequest = await req.json();
    const { action, content_id, module_id, product_id, data } = body;

    log.info(`Action: ${action}`);

    // RISE V3: Usar unified-auth-v2 via cookie __Host-rise_access
    const user = await getAuthenticatedUser(supabase, req);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buyer_id = user.id;

    switch (action) {
      // Alias: get_content maps to "get" for frontend compatibility
      case "get_content":
      case "get": {
        if (!content_id) {
          return new Response(
            JSON.stringify({ error: "content_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: progress } = await supabase
          .from("buyer_content_progress")
          .select("*")
          .eq("content_id", content_id)
          .eq("buyer_id", buyer_id)
          .maybeSingle();

        // Return ContentProgress shape directly (not wrapped)
        const result = progress || {
          id: "",
          buyer_id,
          content_id,
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

      // NEW: get_summary - returns ProgressSummary shape
      case "get_summary": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // 1. Get all modules for this product
        const { data: modulesData } = await supabase
          .from("product_member_modules")
          .select("id, title, position")
          .eq("product_id", product_id)
          .eq("is_active", true)
          .order("position");

        const modulesList = modulesData || [];
        const moduleIds = modulesList.map(m => m.id);

        if (moduleIds.length === 0) {
          return new Response(
            JSON.stringify({
              overall: {
                product_id,
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

        const contentsList = contentsData || [];
        const contentIds = contentsList.map(c => c.id);

        // 3. Get buyer's progress for all these contents
        const { data: progressData } = await supabase
          .from("buyer_content_progress")
          .select("*")
          .eq("buyer_id", buyer_id)
          .in("content_id", contentIds)
          .order("updated_at", { ascending: false });

        const progressList = progressData || [];
        const progressMap = new Map(progressList.map(p => [p.content_id, p]));

        // 4. Build module progress stats
        const moduleStats = modulesList.map(mod => {
          const moduleContents = contentsList.filter(c => c.module_id === mod.id);
          const completedContents = moduleContents.filter(c => {
            const p = progressMap.get(c.id);
            return p?.completed_at;
          });
          const totalDuration = moduleContents.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
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
        const totalWatchTime = progressList.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
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
              product_id,
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

      // NEW: get_last_watched - returns last accessed content
      case "get_last_watched": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get modules for this product
        const { data: mods } = await supabase
          .from("product_member_modules")
          .select("id")
          .eq("product_id", product_id)
          .eq("is_active", true);

        const modIds = mods?.map(m => m.id) || [];

        if (modIds.length === 0) {
          return new Response(
            JSON.stringify(null),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get contents for these modules
        const { data: cts } = await supabase
          .from("product_member_content")
          .select("id")
          .in("module_id", modIds)
          .eq("is_active", true);

        const ctIds = cts?.map(c => c.id) || [];

        if (ctIds.length === 0) {
          return new Response(
            JSON.stringify(null),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get last watched
        const { data: lastWatched } = await supabase
          .from("buyer_content_progress")
          .select("*")
          .eq("buyer_id", buyer_id)
          .in("content_id", ctIds)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return new Response(
          JSON.stringify(lastWatched),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!content_id || !data) {
          return new Response(
            JSON.stringify({ error: "content_id and data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {
          content_id,
          buyer_id,
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
          .eq("content_id", content_id)
          .eq("buyer_id", buyer_id)
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

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete": {
        if (!content_id) {
          return new Response(
            JSON.stringify({ error: "content_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_content_progress")
          .upsert({
            content_id,
            buyer_id,
            progress_percent: 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,content_id",
          });

        if (error) throw error;

        log.info(`Content ${content_id} completed by buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "uncomplete": {
        if (!content_id) {
          return new Response(
            JSON.stringify({ error: "content_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_content_progress")
          .update({
            progress_percent: 0,
            completed_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("content_id", content_id)
          .eq("buyer_id", buyer_id);

        if (error) throw error;

        log.info(`Content ${content_id} uncompleted by buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-module-progress": {
        if (!module_id) {
          return new Response(
            JSON.stringify({ error: "module_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Buscar todos os conteúdos do módulo
        const { data: contents } = await supabase
          .from("product_member_content")
          .select("id")
          .eq("module_id", module_id)
          .eq("is_active", true) as { data: ContentRecord[] | null };

        if (!contents || contents.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              progress: { total: 0, completed: 0, percent: 0 }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const contentIds = contents.map(c => c.id);

        // Buscar progresso do buyer
        const { data: progressData } = await supabase
          .from("buyer_content_progress")
          .select("content_id, completed_at")
          .eq("buyer_id", buyer_id)
          .in("content_id", contentIds) as { data: ProgressWithCompletion[] | null };

        const completedCount = progressData?.filter(p => p.completed_at).length || 0;
        const percent = Math.round((completedCount / contents.length) * 100);

        return new Response(
          JSON.stringify({ 
            success: true, 
            progress: {
              total: contents.length,
              completed: completedCount,
              percent,
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get-product-progress": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Buscar todos os conteúdos do produto
        const { data: modules } = await supabase
          .from("product_member_modules")
          .select("id")
          .eq("product_id", product_id)
          .eq("is_active", true) as { data: ModuleRecord[] | null };

        if (!modules || modules.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              progress: { total: 0, completed: 0, percent: 0, modules: [] }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const moduleIds = modules.map(m => m.id);

        const { data: contents } = await supabase
          .from("product_member_content")
          .select("id, module_id")
          .in("module_id", moduleIds)
          .eq("is_active", true) as { data: ContentWithModule[] | null };

        if (!contents || contents.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              progress: { total: 0, completed: 0, percent: 0, modules: [] }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const contentIds = contents.map(c => c.id);

        // Buscar progresso
        const { data: progressData } = await supabase
          .from("buyer_content_progress")
          .select("content_id, completed_at")
          .eq("buyer_id", buyer_id)
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

        return new Response(
          JSON.stringify({ 
            success: true, 
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
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    log.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
