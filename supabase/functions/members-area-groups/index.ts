import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// Use public CORS for members area
const corsHeaders = PUBLIC_CORS_HEADERS;

interface GroupRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "permissions" | "list_offers" | "link_offers";
  product_id?: string;
  group_id?: string;
  data?: {
    name?: string;
    description?: string;
    is_default?: boolean;
    permissions?: { module_id: string; can_access: boolean }[];
    offer_ids?: string[]; // IDs das ofertas a vincular ao grupo
  };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase as any,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA
    );
    if (rateLimitResult) {
      console.warn(`[members-area-groups] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: GroupRequest = await req.json();
    
    // Verificar autenticação via unified-auth (producer_sessions + JWT fallback)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
    const { action, product_id, group_id, data } = body;

    console.log(`[members-area-groups] Action: ${action}, User: ${producer.id}`);

    // Verificar ownership do produto
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single();

      if (productError || !product || product.user_id !== producer.id) {
        return new Response(
          JSON.stringify({ error: "Product not found or access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    switch (action) {
      case "list": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: groups, error } = await supabase
          .from("product_member_groups")
          .select("*")
          .eq("product_id", product_id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, groups }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        if (!group_id) {
          return new Response(
            JSON.stringify({ error: "group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: group, error } = await supabase
          .from("product_member_groups")
          .select(`
            *,
          permissions:product_member_group_permissions(
            module_id,
            has_access
          )
          `)
          .eq("id", group_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, group }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        if (!product_id || !data?.name) {
          return new Response(
            JSON.stringify({ error: "product_id and name required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: group, error } = await supabase
          .from("product_member_groups")
          .insert({
            product_id,
            name: data.name,
            description: data.description || null,
            is_default: data.is_default || false,
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`[members-area-groups] Created group: ${group.id}`);

        return new Response(
          JSON.stringify({ success: true, group }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!group_id || !data) {
          return new Response(
            JSON.stringify({ error: "group_id and data required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.is_default !== undefined) updateData.is_default = data.is_default;

        const { data: group, error } = await supabase
          .from("product_member_groups")
          .update(updateData)
          .eq("id", group_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, group }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    case "delete": {
      if (!group_id) {
        return new Response(
          JSON.stringify({ error: "group_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se não é o grupo default e obter product_id
      const { data: group, error: fetchError } = await supabase
        .from("product_member_groups")
        .select("is_default, product_id")
        .eq("id", group_id)
        .single();

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (group?.is_default) {
        return new Response(
          JSON.stringify({ error: "Não é possível excluir o grupo padrão" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se é o último grupo (não permitir exclusão)
      const { count, error: countError } = await supabase
        .from("product_member_groups")
        .select("id", { count: 'exact', head: true })
        .eq("product_id", group.product_id);

      if (countError) {
        return new Response(
          JSON.stringify({ error: countError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (count !== null && count <= 1) {
        return new Response(
          JSON.stringify({ error: "Não é possível excluir o único grupo. Produtos devem ter pelo menos 1 grupo." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("product_member_groups")
        .delete()
        .eq("id", group_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

      case "permissions": {
        if (!group_id || !data?.permissions) {
          return new Response(
            JSON.stringify({ error: "group_id and permissions required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Deletar permissões existentes
        await supabase
          .from("product_member_group_permissions")
          .delete()
          .eq("group_id", group_id);

        // Inserir novas permissões
        const permissionsToInsert = data.permissions.map((p) => ({
          group_id,
          module_id: p.module_id,
          has_access: p.can_access,
        }));

        const { error } = await supabase
          .from("product_member_group_permissions")
          .insert(permissionsToInsert);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_offers": {
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: "product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: offers, error } = await supabase
          .from("offers")
          .select("id, name, price, is_default, member_group_id, status")
          .eq("product_id", product_id)
          .eq("status", "active")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, offers }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "link_offers": {
        if (!group_id) {
          return new Response(
            JSON.stringify({ error: "group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const offerIds = data?.offer_ids || [];
        
        // Primeiro, buscar o product_id do grupo para validar ownership das ofertas
        const { data: groupData, error: groupError } = await supabase
          .from("product_member_groups")
          .select("product_id")
          .eq("id", group_id)
          .single();

        if (groupError || !groupData) {
          return new Response(
            JSON.stringify({ error: "Group not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remover vínculo deste grupo de todas as ofertas do produto
        await supabase
          .from("offers")
          .update({ member_group_id: null })
          .eq("product_id", groupData.product_id)
          .eq("member_group_id", group_id);

        // Vincular as ofertas selecionadas a este grupo
        if (offerIds.length > 0) {
          const { error: updateError } = await supabase
            .from("offers")
            .update({ member_group_id: group_id })
            .eq("product_id", groupData.product_id)
            .in("id", offerIds);

          if (updateError) throw updateError;
        }

        console.log(`[members-area-groups] Linked ${offerIds.length} offers to group ${group_id}`);

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
    console.error("[members-area-groups] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
