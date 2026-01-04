import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DripRequest {
  action: "get-settings" | "update-settings" | "check-access" | "unlock-content";
  content_id?: string;
  product_id?: string;
  buyer_id?: string;
  settings?: {
    release_type: "immediate" | "days_after_purchase" | "fixed_date" | "after_completion";
    days_after_purchase?: number;
    fixed_date?: string;
    after_content_id?: string;
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

    const body: DripRequest = await req.json();
    const { action, content_id, product_id, buyer_id, settings } = body;

    console.log(`[members-area-drip] Action: ${action}`);

    // Para ações de vendedor, verificar autenticação
    if (action === "get-settings" || action === "update-settings") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar ownership do conteúdo
      if (content_id) {
        const { data: content } = await supabase
          .from("product_member_content")
          .select("id, module_id")
          .eq("id", content_id)
          .single();

        if (content) {
          const { data: moduleData } = await supabase
            .from("product_member_modules")
            .select("product_id")
            .eq("id", content.module_id)
            .single();

          if (moduleData) {
            const { data: product } = await supabase
              .from("products")
              .select("user_id")
              .eq("id", moduleData.product_id)
              .single();

            if (!product || product.user_id !== user.id) {
              return new Response(
                JSON.stringify({ error: "Access denied" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      }
    }

    switch (action) {
      case "get-settings": {
        if (!content_id) {
          return new Response(
            JSON.stringify({ error: "content_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: dripSettings, error } = await supabase
          .from("content_release_settings")
          .select("*")
          .eq("content_id", content_id)
          .single();

        // Se não existe, retornar padrão (imediato)
        if (error && error.code === "PGRST116") {
          return new Response(
            JSON.stringify({ 
              success: true, 
              settings: { release_type: "immediate" } 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, settings: dripSettings }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-settings": {
        if (!content_id || !settings) {
          return new Response(
            JSON.stringify({ error: "content_id and settings required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("content_release_settings")
          .upsert({
            content_id,
            release_type: settings.release_type,
            days_after_purchase: settings.days_after_purchase || null,
            fixed_date: settings.fixed_date || null,
            after_content_id: settings.after_content_id || null,
          }, {
            onConflict: "content_id",
          });

        if (error) throw error;

        console.log(`[members-area-drip] Updated settings for content ${content_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check-access": {
        if (!content_id || !buyer_id) {
          return new Response(
            JSON.stringify({ error: "content_id and buyer_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Buscar configurações de liberação
        const { data: dripSettings } = await supabase
          .from("content_release_settings")
          .select("*")
          .eq("content_id", content_id)
          .single();

        // Se não tem configuração, acesso imediato
        if (!dripSettings || dripSettings.release_type === "immediate") {
          return new Response(
            JSON.stringify({ success: true, has_access: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verificar acesso específico já liberado
        const { data: contentAccess } = await supabase
          .from("buyer_content_access")
          .select("*")
          .eq("content_id", content_id)
          .eq("buyer_id", buyer_id)
          .eq("is_active", true)
          .single();

        if (contentAccess) {
          // Verificar se não expirou
          if (!contentAccess.expires_at || new Date(contentAccess.expires_at) > new Date()) {
            return new Response(
              JSON.stringify({ success: true, has_access: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Buscar data da compra
        const { data: productAccess } = await supabase
          .from("buyer_product_access")
          .select("granted_at")
          .eq("buyer_id", buyer_id)
          .eq("is_active", true)
          .order("granted_at", { ascending: true })
          .limit(1)
          .single();

        if (!productAccess) {
          return new Response(
            JSON.stringify({ success: true, has_access: false, reason: "no_product_access" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const purchaseDate = new Date(productAccess.granted_at);
        const now = new Date();

        // Verificar por tipo de liberação
        switch (dripSettings.release_type) {
          case "days_after_purchase": {
            const releaseDate = new Date(purchaseDate);
            releaseDate.setDate(releaseDate.getDate() + (dripSettings.days_after_purchase || 0));
            
            if (now >= releaseDate) {
              return new Response(
                JSON.stringify({ success: true, has_access: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                has_access: false, 
                reason: "not_yet_released",
                release_date: releaseDate.toISOString(),
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          case "fixed_date": {
            const fixedDate = new Date(dripSettings.fixed_date!);
            
            if (now >= fixedDate) {
              return new Response(
                JSON.stringify({ success: true, has_access: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                has_access: false, 
                reason: "not_yet_released",
                release_date: fixedDate.toISOString(),
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          case "after_completion": {
            // Verificar se o conteúdo anterior foi concluído
            const { data: progress } = await supabase
              .from("buyer_content_progress")
              .select("completed_at")
              .eq("content_id", dripSettings.after_content_id!)
              .eq("buyer_id", buyer_id)
              .single();

            if (progress?.completed_at) {
              return new Response(
                JSON.stringify({ success: true, has_access: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                has_access: false, 
                reason: "prerequisite_not_completed",
                required_content_id: dripSettings.after_content_id,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ success: true, has_access: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "unlock-content": {
        // Liberar conteúdo manualmente para um buyer
        if (!content_id || !buyer_id) {
          return new Response(
            JSON.stringify({ error: "content_id and buyer_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_content_access")
          .upsert({
            content_id,
            buyer_id,
            is_active: true,
            unlocked_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,content_id",
          });

        if (error) throw error;

        console.log(`[members-area-drip] Manually unlocked content ${content_id} for buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
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
    console.error("[members-area-drip] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
