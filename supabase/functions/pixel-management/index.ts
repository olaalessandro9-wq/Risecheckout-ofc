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
 * @security Requer producer_session token válido
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { RequestBody, jsonResponse } from "../_shared/pixel-types.ts";

// Import handlers
import {
  checkRateLimit,
  validateProducerSession,
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
    // Validar sessão do produtor
    const sessionToken = req.headers.get("x-producer-session-token") || "";
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sessionResult = await validateProducerSession(supabase, sessionToken);
    if (!sessionResult.valid || !sessionResult.producerId) {
      return new Response(
        JSON.stringify({ error: sessionResult.error || "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const producerId = sessionResult.producerId;

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
    let response: Response;
    
    switch (action) {
      // Vendor Pixel CRUD
      case "list":
        response = await handleList(supabase, producerId);
        break;
        
      case "create":
        response = await handleCreate(supabase, producerId, data);
        break;
        
      case "update":
        if (!pixelId) {
          return jsonResponse({ error: "pixelId é obrigatório para update" }, 400, corsHeaders);
        }
        response = await handleUpdate(supabase, producerId, pixelId, data);
        break;
        
      case "delete":
        if (!pixelId) {
          return jsonResponse({ error: "pixelId é obrigatório para delete" }, 400, corsHeaders);
        }
        response = await handleDelete(supabase, producerId, pixelId);
        break;

      // Product Pixel Link actions
      case "list-product-links":
        if (!productId) {
          return jsonResponse({ error: "productId é obrigatório" }, 400, corsHeaders);
        }
        response = await handleListProductLinks(supabase, producerId, productId);
        break;
        
      case "link-to-product":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, 400, corsHeaders);
        }
        response = await handleLinkToProduct(supabase, producerId, productId, pixelId, data);
        break;
        
      case "unlink-from-product":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, 400, corsHeaders);
        }
        response = await handleUnlinkFromProduct(supabase, producerId, productId, pixelId);
        break;
        
      case "update-product-link":
        if (!productId || !pixelId) {
          return jsonResponse({ error: "productId e pixelId são obrigatórios" }, 400, corsHeaders);
        }
        response = await handleUpdateProductLink(supabase, producerId, productId, pixelId, data);
        break;

      default:
        return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400, corsHeaders);
    }

    // Adicionar CORS headers à resposta
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("[pixel-management] ❌ Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
