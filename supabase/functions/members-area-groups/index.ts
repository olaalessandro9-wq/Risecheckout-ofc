/**
 * members-area-groups - Gerenciamento de grupos de membros
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2, getCorsHeadersV2 } from "../_shared/cors-v2.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMIT_CONFIGS,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("members-area-groups");

// === INTERFACES (Zero any) ===

interface PermissionInput {
  module_id: string;
  can_access: boolean;
}

interface GroupData {
  name?: string;
  description?: string;
  is_default?: boolean;
  permissions?: PermissionInput[];
  offer_ids?: string[];
}

interface GroupRequest {
  action: "list" | "get" | "create" | "update" | "delete" | "permissions" | "list_offers" | "link_offers";
  product_id?: string;
  group_id?: string;
  data?: GroupData;
}

interface ProductRecord {
  id: string;
  user_id: string;
}

interface GroupRecord {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface GroupWithPermissions extends GroupRecord {
  permissions: Array<{
    module_id: string;
    has_access: boolean;
  }>;
}

interface OfferRecord {
  id: string;
  name: string;
  price: number;
  is_default: boolean | null;
  member_group_id: string | null;
  status: string;
}

interface PermissionToInsert {
  group_id: string;
  module_id: string;
  has_access: boolean;
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
      RATE_LIMIT_CONFIGS.MEMBERS_AREA,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: GroupRequest = await req.json();
    
    // Verificar autenticação via unified-auth (producer_sessions)
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }
    const { action, product_id, group_id, data } = body;

    log.info(`Action: ${action}, User: ${producer.id}`);

    // Verificar ownership do produto
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single() as { data: ProductRecord | null; error: Error | null };

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
          .order("created_at", { ascending: true }) as { data: GroupRecord[] | null; error: Error | null };

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
          .single() as { data: GroupWithPermissions | null; error: Error | null };

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

        // Se criando como padrão, desativar outros grupos primeiro
        if (data.is_default === true) {
          await supabase
            .from("product_member_groups")
            .update({ is_default: false })
            .eq("product_id", product_id);
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
          .single() as { data: GroupRecord | null; error: Error | null };

        if (error) throw error;

        log.info(`Created group: ${group?.id}`);

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

        // Se estiver definindo como padrão, desativar outros grupos primeiro
        if (data.is_default === true) {
          // Buscar o product_id do grupo atual
          const { data: currentGroup } = await supabase
            .from("product_member_groups")
            .select("product_id")
            .eq("id", group_id)
            .single() as { data: { product_id: string } | null };

          if (currentGroup?.product_id) {
            // Desativar is_default de todos os outros grupos do produto
            await supabase
              .from("product_member_groups")
              .update({ is_default: false })
              .eq("product_id", currentGroup.product_id)
              .neq("id", group_id);
          }
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
          .single() as { data: GroupRecord | null; error: Error | null };

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
        .single() as { data: { is_default: boolean; product_id: string } | null; error: Error | null };

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
        .eq("product_id", group!.product_id);

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
        const permissionsToInsert: PermissionToInsert[] = data.permissions.map((p) => ({
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
          .order("created_at", { ascending: true }) as { data: OfferRecord[] | null; error: Error | null };

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
          .single() as { data: { product_id: string } | null; error: Error | null };

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

        log.info(`Linked ${offerIds.length} offers to group ${group_id}`);

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
    log.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
