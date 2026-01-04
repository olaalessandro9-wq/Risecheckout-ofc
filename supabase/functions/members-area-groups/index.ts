import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GroupRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "permissions";
  product_id?: string;
  group_id?: string;
  data?: {
    name?: string;
    description?: string;
    is_default?: boolean;
    permissions?: { module_id: string; can_access: boolean }[];
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

    // Verificar autenticação
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

    const body: GroupRequest = await req.json();
    const { action, product_id, group_id, data } = body;

    console.log(`[members-area-groups] Action: ${action}, User: ${user.id}`);

    // Verificar ownership do produto
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single();

      if (productError || !product || product.user_id !== user.id) {
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
              can_access
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

        // Verificar se não é o grupo default
        const { data: group } = await supabase
          .from("product_member_groups")
          .select("is_default")
          .eq("id", group_id)
          .single();

        if (group?.is_default) {
          return new Response(
            JSON.stringify({ error: "Cannot delete default group" }),
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
          can_access: p.can_access,
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
