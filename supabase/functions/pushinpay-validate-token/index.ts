/**
 * PushinPay Validate Token Edge Function
 * 
 * @version 1.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Valida token de API PushinPay no backend, evitando:
 * 1. Exposição do token no browser
 * 2. Violações de CSP (Content Security Policy)
 * 3. Chamadas diretas do frontend para APIs externas
 * 
 * Input: { api_token: string, environment: "production" | "sandbox" }
 * Output: { valid: boolean, account?: { id, name, email } }
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("pushinpay-validate-token");

// PushinPay API URLs por ambiente
const PUSHINPAY_API_URLS = {
  production: "https://api.pushinpay.com.br/api/accounts/find",
  sandbox: "https://api-sandbox.pushinpay.com.br/api/accounts/find",
} as const;

type PushinPayEnvironment = "production" | "sandbox";

interface RequestBody {
  api_token: string;
  environment?: PushinPayEnvironment;
}

interface PushinPayAccountInfo {
  id: string;
  name: string;
  email: string;
  document?: string;
}

interface ValidationResult {
  valid: boolean;
  account?: PushinPayAccountInfo;
  error?: string;
}

// Helper function removed - using centralized logger

serve(async (req) => {
  // CORS handling via shared module
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    // Apenas POST permitido
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body: RequestBody = await req.json();
    const { api_token, environment = "production" } = body;

    // Validação de entrada
    if (!api_token || typeof api_token !== "string") {
      log.error('api_token is required');
      return new Response(
        JSON.stringify({ valid: false, error: "API Token é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["production", "sandbox"].includes(environment)) {
      log.error('Invalid environment', { environment });
      return new Response(
        JSON.stringify({ valid: false, error: "Ambiente inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log.info('Validating token', { environment, tokenLength: api_token.length });

    // Chamar API PushinPay
    const apiUrl = PUSHINPAY_API_URLS[environment as PushinPayEnvironment];
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${api_token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      log.error('API returned error', { status: response.status });
      
      // Token inválido ou expirado
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Token inválido ou expirado" 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Outros erros
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Erro ao validar token: ${response.status}` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse response
    const accountData = await response.json();
    
    log.info('Token validated successfully', { 
      accountId: accountData.id,
      hasName: !!accountData.name 
    });

    const result: ValidationResult = {
      valid: true,
      account: {
        id: accountData.id,
        name: accountData.name || "",
        email: accountData.email || "",
        document: accountData.document,
      },
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error('Error', { message: errorMessage });
    
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno ao validar token" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
