/**
 * Stripe Connect OAuth Edge Function
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant - Zero `any`
 * 
 * Gerencia o fluxo OAuth para conectar contas Stripe de vendedores.
 * Endpoints:
 * - POST /start → Inicia OAuth, retorna URL de autorização
 * - POST /callback → Processa callback, salva tokens
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

// CORS Headers - Inclui x-producer-session-token para unified-auth
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-producer-session-token",
};

interface RequestBody {
  action?: string;
}

interface StateRecord {
  vendor_id: string;
  expires_at: string;
  used_at: string | null;
}

interface IntegrationConfig {
  stripe_account_id?: string;
  livemode?: boolean;
  email?: string;
  connected_at?: string;
}

interface IntegrationRecord {
  active: boolean;
  config: IntegrationConfig;
  updated_at: string;
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
    // ACTION: START - Inicia fluxo OAuth
    // ========================================
    if (action === "start") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const vendorId = producer.id;
      logStep("Starting OAuth for vendor", { vendorId });

      // Gerar state único para CSRF protection
      const state = crypto.randomUUID();
      
      // Salvar state no banco para validação posterior
      await supabaseClient.from("oauth_states").insert({
        state,
        vendor_id: vendorId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      });

      // Construir URL de autorização Stripe Connect
      // Usar STRIPE_REDIRECT_URL se configurado (para produção),
      // senão fallback para SUPABASE_URL (desenvolvimento)
      const redirectUri = Deno.env.get("STRIPE_REDIRECT_URL") 
        || `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-connect-oauth?action=callback`;

      // Stripe Connect OAuth URL
      const stripeConnectUrl = new URL("https://connect.stripe.com/oauth/authorize");
      stripeConnectUrl.searchParams.set("response_type", "code");
      stripeConnectUrl.searchParams.set("client_id", Deno.env.get("STRIPE_CLIENT_ID") || "");
      stripeConnectUrl.searchParams.set("scope", "read_write");
      stripeConnectUrl.searchParams.set("redirect_uri", redirectUri);
      stripeConnectUrl.searchParams.set("state", state);
      stripeConnectUrl.searchParams.set("stripe_user[country]", "BR");

      logStep("OAuth URL generated", { url: stripeConnectUrl.toString() });

      return new Response(
        JSON.stringify({ 
          url: stripeConnectUrl.toString(),
          state 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: CALLBACK - Processa retorno OAuth
    // ========================================
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      logStep("Processing callback", { code: !!code, state, error });

      // Verificar se houve erro no OAuth
      if (error) {
        logStep("OAuth error", { error, errorDescription });
        const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://risecheckout.com";
        return Response.redirect(
          `${frontendUrl}/financeiro?stripe_error=${encodeURIComponent(errorDescription || error)}`,
          302
        );
      }

      if (!code || !state) {
        throw new Error("Missing code or state parameter");
      }

      // Validar state (CSRF protection)
      const { data: stateData, error: stateError } = await supabaseClient
        .from("oauth_states")
        .select("vendor_id, expires_at, used_at")
        .eq("state", state)
        .maybeSingle();

      if (stateError || !stateData) {
        throw new Error("Invalid OAuth state");
      }

      const stateRecord = stateData as StateRecord;

      if (stateRecord.used_at) {
        throw new Error("OAuth state already used");
      }

      if (new Date(stateRecord.expires_at) < new Date()) {
        throw new Error("OAuth state expired");
      }

      const vendorId = stateRecord.vendor_id;
      logStep("State validated", { vendorId });

      // Marcar state como usado
      await supabaseClient
        .from("oauth_states")
        .update({ used_at: new Date().toISOString() })
        .eq("state", state);

      // Trocar código por tokens de acesso
      const tokenResponse = await stripe.oauth.token({
        grant_type: "authorization_code",
        code,
      });

      logStep("Token exchange successful", { 
        accountId: tokenResponse.stripe_user_id,
        livemode: tokenResponse.livemode 
      });

      const stripeAccountId = tokenResponse.stripe_user_id;
      const accessToken = tokenResponse.access_token;
      const refreshToken = tokenResponse.refresh_token;
      const livemode = tokenResponse.livemode;

      // Buscar informações da conta conectada
      const account = await stripe.accounts.retrieve(stripeAccountId!);
      
      logStep("Account info retrieved", { 
        email: account.email,
        business_type: account.business_type 
      });

      // ✅ SEC-01 FIX: Salvar tokens sensíveis no Vault
      const { saveCredentialsToVault } = await import('../_shared/vault-credentials.ts');
      
      const vaultResult = await saveCredentialsToVault(supabaseClient, vendorId, 'STRIPE', {
        access_token: accessToken!,
        refresh_token: refreshToken || undefined
      });
      
      if (!vaultResult.success) {
        logStep("Error saving to Vault", { error: vaultResult.error });
        throw new Error("Failed to save credentials securely");
      }
      
      logStep("Credentials saved to Vault");

      // Salvar integração em vendor_integrations (APENAS metadados públicos)
      const integrationConfig = {
        stripe_account_id: stripeAccountId,
        // ✅ SEC-01 FIX: NÃO salvar tokens aqui
        livemode,
        is_test: !livemode,
        email: account.email,
        business_type: account.business_type,
        connected_at: new Date().toISOString(),
        credentials_in_vault: true // Flag indicando que tokens estão no Vault
      };

      // Upsert na vendor_integrations
      const { error: upsertError } = await supabaseClient
        .from("vendor_integrations")
        .upsert({
          vendor_id: vendorId,
          integration_type: "STRIPE",
          active: true,
          config: integrationConfig,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "vendor_id,integration_type",
        });

      if (upsertError) {
        logStep("Error saving integration", { error: upsertError });
        throw new Error("Failed to save Stripe integration");
      }

      logStep("Integration saved successfully");

      // Redirecionar para frontend com sucesso
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://risecheckout.com";
      return Response.redirect(
        `${frontendUrl}/financeiro?stripe_success=true&account=${stripeAccountId}`,
        302
      );
    }

    // ========================================
    // ACTION: DISCONNECT - Desconecta conta
    // ========================================
    if (action === "disconnect") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const vendorId = producer.id;
      logStep("Disconnecting Stripe for vendor", { vendorId });

      // Buscar integração existente
      const { data: integration } = await supabaseClient
        .from("vendor_integrations")
        .select("config")
        .eq("vendor_id", vendorId)
        .eq("integration_type", "STRIPE")
        .maybeSingle();

      const integrationData = integration as IntegrationRecord | null;

      if (integrationData?.config?.stripe_account_id) {
        // Revogar acesso no Stripe
        try {
          await stripe.oauth.deauthorize({
            client_id: Deno.env.get("STRIPE_CLIENT_ID") || "",
            stripe_user_id: integrationData.config.stripe_account_id,
          });
          logStep("Stripe access revoked");
        } catch (revokeError) {
          logStep("Error revoking Stripe access (continuing)", { error: revokeError });
        }
      }

      // Desativar integração no banco
      await supabaseClient
        .from("vendor_integrations")
        .update({ 
          active: false,
          config: {},
          updated_at: new Date().toISOString()
        })
        .eq("vendor_id", vendorId)
        .eq("integration_type", "STRIPE");

      logStep("Integration disconnected");

      return new Response(
        JSON.stringify({ success: true, message: "Stripe disconnected successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // ACTION: STATUS - Verifica status da conexão
    // ========================================
    if (action === "status") {
      let producer;
      try {
        producer = await requireAuthenticatedProducer(supabaseClient, req);
      } catch {
        return unauthorizedResponse(corsHeaders);
      }

      const vendorId = producer.id;

      const { data: integration } = await supabaseClient
        .from("vendor_integrations")
        .select("active, config, updated_at")
        .eq("vendor_id", vendorId)
        .eq("integration_type", "STRIPE")
        .maybeSingle();

      const integrationData = integration as IntegrationRecord | null;
      const connected = integrationData?.active && integrationData?.config?.stripe_account_id;

      return new Response(
        JSON.stringify({
          connected,
          account_id: connected ? integrationData.config.stripe_account_id : null,
          email: connected ? integrationData.config.email : null,
          livemode: connected ? integrationData.config.livemode : null,
          connected_at: connected ? integrationData.config.connected_at : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
