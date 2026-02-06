/**
 * Edge Function: verify-turnstile
 * 
 * Verifica tokens do Cloudflare Turnstile (CAPTCHA)
 * Usada antes de processar pagamentos no checkout
 * 
 * SECURITY: Rate limiting implementado
 * 
 * @version 2.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Zero any)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { 
  rateLimitMiddleware, 
  TURNSTILE_VERIFY,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("VerifyTurnstile");

// === INTERFACES (Zero any) ===

interface TurnstileVerifyRequest {
  token: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

// Use public CORS for Turnstile as it's called from checkout pages
const corsHeaders = PUBLIC_CORS_HEADERS;

// === MAIN HANDLER ===

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase: SupabaseClient = getSupabaseClient('general');

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      TURNSTILE_VERIFY,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    if (!secretKey) {
      log.error("TURNSTILE_SECRET_KEY não configurada");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Captcha não configurado no servidor' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: TurnstileVerifyRequest = await req.json();
    const { token } = body;

    if (!token) {
      log.warn("Token não fornecido");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token do captcha não fornecido' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar token com a API do Cloudflare
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    // Opcional: adicionar IP do cliente para verificação adicional
    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
    if (clientIP) {
      formData.append('remoteip', clientIP.split(',')[0].trim());
    }

    log.debug("Verificando token com Cloudflare...");

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result: TurnstileVerifyResponse = await verifyResponse.json();

    log.debug("Resposta Cloudflare:", {
      success: result.success,
      hostname: result.hostname,
      errorCodes: result['error-codes'],
    });

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true,
          hostname: result.hostname,
          challenge_ts: result.challenge_ts,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorCodes = result['error-codes'] || [];
      let errorMessage = 'Verificação do captcha falhou';

      // Traduzir códigos de erro comuns
      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'Captcha expirado. Por favor, tente novamente.';
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Token de captcha inválido';
      } else if (errorCodes.includes('bad-request')) {
        errorMessage = 'Requisição mal formada';
      }

      log.warn("Verificação falhou:", errorCodes);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          codes: errorCodes,
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Erro:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno ao verificar captcha' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
