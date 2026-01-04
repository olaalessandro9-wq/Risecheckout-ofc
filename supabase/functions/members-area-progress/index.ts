import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgressRequest {
  action: "get" | "update" | "complete" | "get-module-progress" | "get-product-progress";
  content_id?: string;
  module_id?: string;
  product_id?: string;
  buyer_token?: string;
  data?: {
    progress_percent?: number;
    last_position_seconds?: number;
    watch_time_seconds?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ProgressRequest = await req.json();
    const { action, content_id, module_id, product_id, buyer_token, data } = body;

    console.log(`[members-area-progress] Action: ${action}`);

    // Validar buyer token
    if (!buyer_token) {
      return new Response(
        JSON.stringify({ error: "buyer_token required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar sessão do buyer
    const { data: session, error: sessionError } = await supabase
      .from("buyer_sessions")
      .select("buyer_id, expires_at, is_valid")
      .eq("session_token", buyer_token)
      .single();

    if (sessionError || !session || !session.is_valid) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buyer_id = session.buyer_id;

    switch (action) {
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
          .single();

        return new Response(
          JSON.stringify({ 
            success: true, 
            progress: progress || {
              progress_percent: 0,
              last_position_seconds: 0,
              watch_time_seconds: 0,
              completed_at: null,
            }
          }),
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
          .single();

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

        console.log(`[members-area-progress] Content ${content_id} completed by buyer ${buyer_id}`);

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
          .eq("is_active", true);

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
          .in("content_id", contentIds);

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
          .eq("is_active", true);

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
          .eq("is_active", true);

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
          .in("content_id", contentIds);

        const completedSet = new Set(
          progressData?.filter(p => p.completed_at).map(p => p.content_id) || []
        );

        // Calcular por módulo
        const moduleProgress: Record<string, { total: number; completed: number }> = {};
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
    console.error("[members-area-progress] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
