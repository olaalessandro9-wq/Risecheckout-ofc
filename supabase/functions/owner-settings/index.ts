/**
 * Edge Function: owner-settings
 * 
 * Responsabilidade: Operações de configuração exclusivas do Owner
 * 
 * Ações:
 * - set-gateway-environment: Atualiza o ambiente de um gateway (sandbox/production)
 * - get-gateway-environments: Busca os ambientes de todos os gateways
 * 
 * Segurança:
 * - Requer autenticação JWT
 * - Valida role Owner (mais restritiva que Admin)
 * - Logging completo de todas as operações
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2, PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

type GatewayType = 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe';
type GatewayEnvironment = 'sandbox' | 'production';

interface SetGatewayEnvironmentPayload {
  gateway: GatewayType;
  environment: GatewayEnvironment;
}

const VALID_GATEWAYS: GatewayType[] = ['asaas', 'mercadopago', 'pushinpay', 'stripe'];
const VALID_ENVIRONMENTS: GatewayEnvironment[] = ['sandbox', 'production'];

serve(async (req) => {
  // Handle CORS preflight (V2 - environment-aware)
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Token não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is owner (most restrictive)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "owner") {
      console.warn(`[owner-settings] Acesso negado para user ${user.id} com role ${profile?.role}`);
      return new Response(
        JSON.stringify({ success: false, error: "Acesso restrito ao owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Corpo da requisição inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[owner-settings] Action: ${action}, User: ${user.id}`);

    // === ACTION: GET GATEWAY ENVIRONMENTS ===
    if (action === "get-gateway-environments" && (req.method === "GET" || req.method === "POST")) {
      const keys = VALID_GATEWAYS.map(g => `gateway_environment_${g}`);

      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", keys);

      if (error) {
        console.error("[owner-settings] Erro ao buscar ambientes:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao buscar ambientes" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const environments: Record<GatewayType, GatewayEnvironment> = {
        asaas: 'production',
        mercadopago: 'production',
        pushinpay: 'production',
        stripe: 'production',
      };

      data?.forEach((row) => {
        const gateway = row.key.replace('gateway_environment_', '') as GatewayType;
        if (VALID_GATEWAYS.includes(gateway)) {
          environments[gateway] = row.value === 'sandbox' ? 'sandbox' : 'production';
        }
      });

      return new Response(
        JSON.stringify({ success: true, environments }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ACTION: SET GATEWAY ENVIRONMENT ===
    if (action === "set-gateway-environment" && req.method === "POST") {
      const { gateway, environment } = body as unknown as SetGatewayEnvironmentPayload;

      // Validações
      if (!gateway || !VALID_GATEWAYS.includes(gateway)) {
        return new Response(
          JSON.stringify({ success: false, error: `Gateway inválido. Use: ${VALID_GATEWAYS.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
        return new Response(
          JSON.stringify({ success: false, error: `Ambiente inválido. Use: ${VALID_ENVIRONMENTS.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const key = `gateway_environment_${gateway}`;

      const { error } = await supabase
        .from("platform_settings")
        .update({ 
          value: environment, 
          updated_at: new Date().toISOString() 
        })
        .eq("key", key);

      if (error) {
        console.error("[owner-settings] Erro ao atualizar ambiente:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao atualizar ambiente" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[owner-settings] Gateway ${gateway} alterado para ${environment} por ${user.id}`);
      return new Response(
        JSON.stringify({ success: true, gateway, environment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[owner-settings] Erro não tratado:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
