/**
 * ============================================================================
 * Edge Function: utmify-validate-credentials
 * ============================================================================
 * 
 * @module utmify-validate-credentials
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Diagnóstico de tokens UTMify:
 * - Recupera token do Vault via SSOT
 * - Exibe fingerprint (SHA-256 12 chars)
 * - Testa contra API UTMify real
 * - Retorna diagnóstico completo
 * 
 * Segurança:
 * - Autenticação obrigatória via unified-auth-v2
 * - Validação de ownership (vendorId === userId)
 * - Token NUNCA exposto (apenas fingerprint)
 * - Request de teste usa isTest: true
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { getAuthenticatedUser } from "../_shared/unified-auth-v2.ts";
import { 
  getUTMifyToken, 
  listEnabledEvents,
  UTMIFY_API_URL,
  PLATFORM_NAME 
} from "../_shared/utmify/index.ts";

const log = createLogger("utmify-validate-credentials");

// ============================================================================
// TYPES
// ============================================================================

interface ValidateRequest {
  vendorId: string;
}

interface ValidateResponse {
  valid: boolean;
  message: string;
  details: {
    fingerprint: string | null;
    tokenLength: number;
    normalizationApplied: boolean;
    normalizationChanges: string[];
    apiTest: {
      performed: boolean;
      statusCode?: number;
      response?: string;
    };
    configStatus: {
      hasToken: boolean;
      eventsEnabled: string[];
    };
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request): Promise<Response> => {
  // CORS handling
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  // Only POST allowed
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabaseClient('general');

    // 1. Authentication
    const user = await getAuthenticatedUser(supabase, req);
    if (!user) {
      log.warn("Unauthorized access attempt");
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const body = await req.json() as ValidateRequest;
    const { vendorId } = body;

    if (!vendorId) {
      return new Response(
        JSON.stringify({ error: "vendorId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Ownership validation (RISE V3: user can only validate their own tokens)
    if (user.id !== vendorId) {
      log.warn("Ownership violation", { userId: user.id, vendorId });
      return new Response(
        JSON.stringify({ error: "Você só pode validar suas próprias credenciais" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info("Starting UTMify token validation", { vendorId, userId: user.id });

    // 4. Retrieve token from Vault
    const tokenResult = await getUTMifyToken(supabase, vendorId);
    
    // 5. Get enabled events
    const eventsEnabled = await listEnabledEvents(supabase, vendorId);

    // 6. If no token, return early
    if (!tokenResult.token) {
      log.info("No UTMify token configured", { vendorId });
      
      const response: ValidateResponse = {
        valid: false,
        message: "Nenhum token UTMify configurado para este vendor",
        details: {
          fingerprint: null,
          tokenLength: 0,
          normalizationApplied: tokenResult.normalizationApplied,
          normalizationChanges: tokenResult.changes,
          apiTest: {
            performed: false,
          },
          configStatus: {
            hasToken: false,
            eventsEnabled,
          },
        },
      };

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Build test payload
    const nowFormatted = new Date().toISOString().replace("T", " ").slice(0, 19);
    
    const testPayload = {
      orderId: `test_${Date.now()}`,
      platform: PLATFORM_NAME,
      paymentMethod: "pix",
      status: "waiting_payment",
      createdAt: nowFormatted,
      approvedDate: nowFormatted,
      refundedAt: null,
      customer: {
        name: "Test Customer",
        email: "test@risecheckout.com",
        phone: null,
        document: null,
        country: "BR",
        ip: "127.0.0.1",
      },
      products: [{
        id: "test_product",
        name: "Test Product",
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: 1000,
      }],
      trackingParameters: {
        src: null,
        sck: null,
        utm_source: null,
        utm_campaign: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
      },
      commission: {
        totalPriceInCents: 1000,
        gatewayFeeInCents: 0,
        userCommissionInCents: 1000,
        currency: "BRL",
      },
      isTest: true,
    };

    // 8. Execute API test
    let apiTest: ValidateResponse["details"]["apiTest"];
    
    try {
      log.info("Testing UTMify API", { fingerprint: tokenResult.fingerprint });
      
      const apiResponse = await fetch(UTMIFY_API_URL, {
        method: "POST",
        headers: {
          "x-api-token": tokenResult.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      const responseText = await apiResponse.text();
      
      apiTest = {
        performed: true,
        statusCode: apiResponse.status,
        response: responseText.length > 500 
          ? responseText.substring(0, 500) + "..." 
          : responseText,
      };

      log.info("UTMify API test completed", { 
        statusCode: apiResponse.status,
        fingerprint: tokenResult.fingerprint,
      });
    } catch (fetchError) {
      log.error("UTMify API test failed", { 
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        fingerprint: tokenResult.fingerprint,
      });
      
      apiTest = {
        performed: true,
        statusCode: 0,
        response: fetchError instanceof Error ? fetchError.message : "Network error",
      };
    }

    // 9. Determine validity
    const isValid = apiTest.statusCode === 200 || apiTest.statusCode === 201;
    
    const response: ValidateResponse = {
      valid: isValid,
      message: isValid 
        ? "Token válido e funcionando" 
        : `Token rejeitado pela API UTMify (HTTP ${apiTest.statusCode})`,
      details: {
        fingerprint: tokenResult.fingerprint,
        tokenLength: tokenResult.token.length,
        normalizationApplied: tokenResult.normalizationApplied,
        normalizationChanges: tokenResult.changes,
        apiTest,
        configStatus: {
          hasToken: true,
          eventsEnabled,
        },
      },
    };

    log.info("Validation complete", { 
      vendorId, 
      valid: isValid, 
      fingerprint: tokenResult.fingerprint,
    });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    log.error("Unexpected error in validation", { 
      error: error instanceof Error ? error.message : String(error),
    });

    return new Response(
      JSON.stringify({ 
        error: "Erro interno ao validar credenciais",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
