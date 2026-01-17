/**
 * Stripe Connect OAuth Edge Function
 * 
 * @version 3.0.0 - RISE Protocol V2 Compliant - Refatorado
 * 
 * Gerencia o fluxo OAuth para conectar contas Stripe de vendedores.
 * Endpoints:
 * - POST /start → Inicia OAuth, retorna URL de autorização
 * - POST /callback → Processa callback, salva tokens
 * - POST /disconnect → Desconecta conta
 * - POST /status → Verifica status da conexão
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

// Handlers
import { startOAuthFlow } from "./handlers/oauth-start.ts";
import { processOAuthCallback } from "./handlers/oauth-callback.ts";
import { disconnectStripe } from "./handlers/disconnect.ts";
import { getStripeStatus } from "./handlers/status.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface RequestBody {
  action?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-CONNECT-OAUTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const url = new URL(req.url);
    
    // Suporte para action via query param OU body
    let action = url.searchParams.get("action");
    let bodyData: RequestBody = {};
    
    if (req.method === "POST" || req.method === "GET") {
      try {
        const clonedReq = req.clone();
        bodyData = await clonedReq.json().catch(() => ({}));
        if (bodyData.action) {
          action = bodyData.action;
        }
      } catch {
        // Body vazio é OK
      }
    }
    
    action = action || "start";
    logStep("Processing action", { action });

    // ========================================
    // ACTION: START
    // ========================================
    if (action === "start") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const result = await startOAuthFlow(supabaseClient, producer.id);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error, code: result.errorCode }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ url: result.url, state: result.state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: CALLBACK
    // ========================================
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      logStep("Processing callback", { code: !!code, state, error });

      // Verificar se houve erro no OAuth
      if (error) {
        const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://risecheckout.com";
        return Response.redirect(
          `${frontendUrl}/dashboard/financeiro?stripe_error=${encodeURIComponent(errorDescription || error)}`,
          302
        );
      }

      if (!code || !state) {
        throw new Error("Missing code or state parameter");
      }

      const result = await processOAuthCallback(supabaseClient, stripe, code, state);

      if (!result.success) {
        throw new Error(result.error);
      }

      return Response.redirect(result.redirectUrl!, 302);
    }

    // ========================================
    // ACTION: DISCONNECT
    // ========================================
    if (action === "disconnect") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const result = await disconnectStripe(supabaseClient, stripe, producer.id);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: STATUS
    // ========================================
    if (action === "status") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const result = await getStripeStatus(supabaseClient, producer.id);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
