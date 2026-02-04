/**
 * UTMify Conversion Edge Function
 * 
 * @module utmify-conversion
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Envia dados de conversão para a API UTMify conforme documentação oficial:
 * https://api.utmify.com.br/api-credentials/orders
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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

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

    // Validate request
    const validation = validateRequest(requestData);
    if (!validation.valid) {
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

    const conversionRequest = requestData as UTMifyConversionRequest;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get UTMify token from users table (SSOT)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("utmify_token")
      .eq("id", conversionRequest.vendorId)
      .single();

    if (userError) {
      log.error("Error fetching vendor:", userError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Vendor not found" } satisfies EdgeFunctionResponse),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = user?.utmify_token;

    if (!token) {
      log.info("No UTMify token configured for vendor:", conversionRequest.vendorId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No UTMify token configured for this vendor" 
        } satisfies EdgeFunctionResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
