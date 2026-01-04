import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentRequest {
  action: "list" | "get" | "add-to-group" | "remove-from-group" | "revoke-access" | "grant-access";
  product_id?: string;
  buyer_id?: string;
  group_id?: string;
  order_id?: string;
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

    const body: StudentRequest = await req.json();
    const { action, product_id, buyer_id, group_id, order_id } = body;

    console.log(`[members-area-students] Action: ${action}, User: ${user.id}`);

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

        // Buscar alunos com acesso ao produto
        const { data: students, error } = await supabase
          .from("buyer_product_access")
          .select(`
            id,
            is_active,
            granted_at,
            expires_at,
            access_type,
            buyer_id,
            order_id
          `)
          .eq("product_id", product_id)
          .order("granted_at", { ascending: false });

        if (error) throw error;

        // Buscar detalhes dos buyers
        const buyerIds = [...new Set(students?.map(s => s.buyer_id).filter(Boolean) || [])];
        
        const { data: buyers } = await supabase
          .from("buyer_profiles")
          .select("id, name, email, created_at")
          .in("id", buyerIds);

        const buyersMap: Record<string, { id: string; name: string | null; email: string; created_at: string }> = {};
        buyers?.forEach(b => { buyersMap[b.id] = b; });
        
        const { data: buyerGroups } = await supabase
          .from("buyer_groups")
          .select(`
            buyer_id,
            group_id
          `)
          .in("buyer_id", buyerIds)
          .eq("is_active", true);

        // Buscar nomes dos grupos
        const groupIds = [...new Set(buyerGroups?.map(bg => bg.group_id) || [])];
        const { data: groups } = await supabase
          .from("product_member_groups")
          .select("id, name")
          .in("id", groupIds);

        const groupsMap: Record<string, string> = {};
        groups?.forEach(g => { groupsMap[g.id] = g.name; });

        // Mapear grupos por buyer
        const groupsByBuyer: Record<string, { id: string; name: string }[]> = {};
        buyerGroups?.forEach(bg => {
          if (!groupsByBuyer[bg.buyer_id]) {
            groupsByBuyer[bg.buyer_id] = [];
          }
          groupsByBuyer[bg.buyer_id].push({
            id: bg.group_id,
            name: groupsMap[bg.group_id] || "Unknown",
          });
        });

        // Adicionar dados aos estudantes
        const studentsWithGroups = students?.map(s => ({
          ...s,
          buyer: buyersMap[s.buyer_id] || null,
          groups: groupsByBuyer[s.buyer_id] || [],
        }));

        return new Response(
          JSON.stringify({ success: true, students: studentsWithGroups }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: student, error } = await supabase
          .from("buyer_profiles")
          .select(`
            *,
            access:buyer_product_access(
              id,
              is_active,
              granted_at,
              expires_at,
              order:orders(*)
            ),
            groups:buyer_groups(
              group:product_member_groups(*)
            ),
            progress:buyer_content_progress(
              content_id,
              progress_percent,
              completed_at
            )
          `)
          .eq("id", buyer_id)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, student }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add-to-group": {
        if (!buyer_id || !group_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_groups")
          .upsert({
            buyer_id,
            group_id,
            is_active: true,
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,group_id",
          });

        if (error) throw error;

        console.log(`[members-area-students] Added buyer ${buyer_id} to group ${group_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove-from-group": {
        if (!buyer_id || !group_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and group_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_groups")
          .update({ is_active: false })
          .eq("buyer_id", buyer_id)
          .eq("group_id", group_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "revoke-access": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_product_access")
          .update({ is_active: false })
          .eq("buyer_id", buyer_id)
          .eq("product_id", product_id);

        if (error) throw error;

        console.log(`[members-area-students] Revoked access for buyer ${buyer_id}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "grant-access": {
        if (!buyer_id || !product_id) {
          return new Response(
            JSON.stringify({ error: "buyer_id and product_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("buyer_product_access")
          .upsert({
            buyer_id,
            product_id,
            order_id: order_id || "00000000-0000-0000-0000-000000000000", // Manual grant
            is_active: true,
            access_type: "manual",
            granted_at: new Date().toISOString(),
          }, {
            onConflict: "buyer_id,product_id,order_id",
          });

        if (error) throw error;

        console.log(`[members-area-students] Granted access to buyer ${buyer_id}`);

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
    console.error("[members-area-students] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
