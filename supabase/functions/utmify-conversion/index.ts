/**
 * UTMify Conversion Edge Function
 * 
 * @module utmify-conversion
 * @version 3.0.0 - RISE Protocol V3 Compliant - Vault SSOT
 * 
 * Envia dados de conversão para a API UTMify conforme documentação oficial:
 * https://api.utmify.com.br/api-credentials/orders
 * 
 * Mudanças V3.0.0:
 * - Token recuperado do Vault via RPC get_gateway_credentials (SSOT)
 * - Padrão unificado com MercadoPago, Asaas e outras integrações
 * 
 * Mudanças V2.0.0:
 * - URL corrigida: api-credentials/orders (não api/v1/conversion)
 * - Header corrigido: x-api-token (não Authorization: Bearer)
 * - Payload conforme documentação oficial
 * - Campo platform obrigatório: "RiseCheckout"
 * - Validação completa de campos obrigatórios
 * 
 * @category Tracking
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { normalizeUTMifyToken } from "../_shared/utmify/token-normalizer.ts";

import { UTMIFY_API_URL, type UTMifyConversionRequest, type EdgeFunctionResponse } from "./types.ts";
import { validateRequest } from "./validators.ts";
import { buildUTMifyPayload } from "./payload-builder.ts";

const log = createLogger("UtmifyConversion");

serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;

  try {
    // Parse request body
    let requestData: unknown;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" } satisfies EdgeFunctionResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and normalize request (handles both flat and nested orderData payloads)
    const validation = validateRequest(requestData);
    if (!validation.valid || !validation.normalizedPayload) {
      log.error("Validation failed:", validation.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Validation failed", 
          details: validation.errors 
        } satisfies EdgeFunctionResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use normalized payload (extracted from orderData if frontend format)
    const conversionRequest = validation.normalizedPayload;

    // Initialize Supabase client
    const supabase = getSupabaseClient('general');

    // Get UTMify token from Vault via RPC (RISE V3 - SSOT)
    // Pattern: Same as MercadoPago, Asaas, and other gateway integrations
    // RPC returns: { success: boolean, credentials?: { api_token: string }, error?: string }
    const { data: vaultResponse, error: vaultError } = await supabase.rpc(
      "get_gateway_credentials",
      {
        p_vendor_id: conversionRequest.vendorId,
        p_gateway: "utmify",
      }
    );

    if (vaultError) {
      log.error("Error calling Vault RPC:", vaultError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to retrieve UTMify credentials" 
        } satisfies EdgeFunctionResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract token from RPC response structure
    // vaultResponse = { success: true, credentials: { api_token: "..." } }
    const rawToken = vaultResponse?.credentials?.api_token as string | undefined;

    if (!rawToken) {
      log.info(`No UTMify token configured for vendor: ${conversionRequest.vendorId} - Response: ${JSON.stringify(vaultResponse)}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No UTMify token configured for this vendor" 
        } satisfies EdgeFunctionResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RISE V3: Usar normalizador SSOT
    const { normalized: token, changes } = normalizeUTMifyToken(rawToken);

    if (token.length === 0) {
      log.error("Token UTMify vazio após normalização");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "UTMify token is empty after sanitization" 
        } satisfies EdgeFunctionResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log de diagnóstico (sem expor o token)
    if (changes.length > 0) {
      log.warn("Token UTMify normalizado via SSOT", { changes });
    }

    log.info("UTMify token retrieved and normalized successfully", {
      tokenLength: token.length
    });

    // Build payload according to UTMify API documentation
    const payload = buildUTMifyPayload(conversionRequest);

    log.info(`Sending conversion for order ${payload.orderId} to UTMify`);

    // Send to UTMify API with correct headers
    const utmifyResponse = await fetch(UTMIFY_API_URL, {
      method: "POST",
      headers: {
        "x-api-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await utmifyResponse.text();

    if (!utmifyResponse.ok) {
      log.error(`UTMify API error (${utmifyResponse.status}):`, responseText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "UTMify API error",
          details: {
            status: utmifyResponse.status,
            message: responseText,
          }
        } satisfies EdgeFunctionResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info(`Conversion sent successfully for order ${payload.orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conversion sent to UTMify successfully" 
      } satisfies EdgeFunctionResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error" 
      } satisfies EdgeFunctionResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
