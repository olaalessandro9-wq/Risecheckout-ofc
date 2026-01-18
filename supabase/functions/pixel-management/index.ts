/**
 * Edge Function: pixel-management
 * 
 * Router principal para gerenciamento de pixels.
 * Handlers extraídos para _shared/ para manter < 300 linhas.
 * 
 * Ações disponíveis:
 * - list: Listar pixels do vendedor
 * - create: Criar novo pixel
 * - update: Atualizar pixel existente
 * - delete: Excluir pixel
 * - list-product-links: Listar vínculos de um produto
 * - link-to-product: Vincular pixel a produto
 * - unlink-from-product: Desvincular pixel de produto
 * - update-product-link: Atualizar configurações do vínculo
 * 
 * @version 2.0.0
 * @refactored 2026-01-13 - Handlers extraídos para _shared/pixel-handlers.ts
 * @refactored 2026-01-18 - jsonResponse signature standardized
 * @security Requer producer_session token válido
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { RequestBody, jsonResponse } from "../_shared/pixel-types.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// Import handlers
import {
  checkRateLimit,
  handleList,
  handleCreate,
  handleUpdate,
  handleDelete,
} from "../_shared/pixel-handlers.ts";

import {
  handleListProductLinks,
  handleLinkToProduct,
  handleUnlinkFromProduct,
  handleUpdateProductLink,
} from "../_shared/pixel-handlers-links.ts";

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // CORS handling
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth via unified-auth
    let producerId: string;
    try {
      const producer = await requireAuthenticatedProducer(supabase, req);
      producerId = producer.id;
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    // Parse body
    const body: RequestBody = await req.json();
    const { action, pixelId, productId, data } = body;

    console.log(`[pixel-management] Action: ${action}, Producer: ${producerId}`);

    // Rate limiting
    const rateLimit = await checkRateLimit(supabase, producerId, action);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Muitas requisições. Tente novamente mais tarde.",
          retryAfter: rateLimit.retryAfter,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 300),
          } 
        }
      );
    }

    // Router
    switch (action) {
      // Vendor Pixel CRUD
      case "list":
        return await handleList(supabase, producerId, corsHeaders);
        
      case "create":
        return await handleCreate(supabase, producerId, data, corsHeaders);
        
      case "update":
        if (!pixelId) {
          return jsonResponse({ error: "pixelId é obrigatório para update" }, corsHeaders, 400);
        }
        return await handleUpdate(supabase, producerId, pixelId, data, corsHeaders);
        
      case "delete":
        if (!pixelId) {
          return jsonResponse({ error: "pixelId é obrigatório para delete" }, corsHeaders, 400);
        }
        return await handleDelete(supabase, producerId, pixelId, corsHeaders);

      // Product Pixel Link actions
      case "list-product-links":
        if (!productId) {
          return jsonResponse({ error: "productId é obrigatório" }, corsHeaders, 400);
        }
        return await handleListProductLinks(supabase, producerId, productId, corsHeaders);
        
      case "link-to-product":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, corsHeaders, 400);
        }
        return await handleLinkToProduct(supabase, producerId, productId, pixelId, data, corsHeaders);
        
      case "unlink-from-product":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, corsHeaders, 400);
        }
        return await handleUnlinkFromProduct(supabase, producerId, productId, pixelId, corsHeaders);
        
      case "update-product-link":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, corsHeaders, 400);
        }
        return await handleUpdateProductLink(supabase, producerId, productId, pixelId, data, corsHeaders);

      default:
        return jsonResponse({ error: `Ação desconhecida: ${action}` }, corsHeaders, 400);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("[pixel-management] ❌ Unhandled error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
