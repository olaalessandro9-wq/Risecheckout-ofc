/**
 * Edge Function: verify-turnstile
 * 
 * Verifica tokens do Cloudflare Turnstile (CAPTCHA)
 * Usada antes de processar pagamentos no checkout
 * 
 * SECURITY: Rate limiting implementado
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliance (Zero any)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { 
  rateLimitMiddleware, 
  TURNSTILE_VERIFY,
  getClientIP 
} from "../_shared/rate-limiting/index.ts";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      TURNSTILE_VERIFY,
      corsHeaders
    );
    if (rateLimitResult) {
      console.warn(`[verify-turnstile] Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    if (!secretKey) {
      console.error('[verify-turnstile] TURNSTILE_SECRET_KEY não configurada');
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
      console.warn('[verify-turnstile] Token não fornecido');
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

    console.log('[verify-turnstile] Verificando token com Cloudflare...');

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result: TurnstileVerifyResponse = await verifyResponse.json();

    console.log('[verify-turnstile] Resposta Cloudflare:', {
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

      console.warn('[verify-turnstile] Verificação falhou:', errorCodes);

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
    console.error('[verify-turnstile] Erro:', errorMessage);
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
