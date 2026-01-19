/**
 * integration-management Edge Function
 * 
 * RISE Protocol V3 Compliant - unified-auth.ts
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { withSentry, captureException } from "../_shared/sentry.ts";
import { getAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";

import {
  handleSaveCredentials,
  handleDisconnect,
  handleInitOAuth,
  handleGetStatus,
  handleSaveProfileWallet,
  handleClearProfileWallet,
  handleUpdateProfile,
  errorResponse,
} from "../_shared/integration-handlers.ts";

serve(withSentry("integration-management", async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const url = new URL(req.url);
    const urlAction = url.pathname.split("/").pop();

    let body: Record<string, unknown> = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { return errorResponse("Corpo da requisição inválido", corsHeaders, 400); }
    }

    const bodyAction = typeof body.action === "string" ? body.action : null;
    const action = bodyAction ?? (urlAction && urlAction !== "integration-management" ? urlAction : null);

    if (!action) {
      return errorResponse("Ação não informada (use body.action ou path)", corsHeaders, 400);
    }

    console.log(`[integration-management] Action: ${action} (from ${bodyAction ? "body" : "url"}), Method: ${req.method}`);

    // ✅ RISE V3: unified-auth.ts
    const producer = await getAuthenticatedProducer(supabase, req);
    if (!producer) {
      return unauthorizedResponse(corsHeaders);
    }

    const producerId = producer.id;
    console.log(`[integration-management] Authenticated producer: ${producerId}`);

    if (action === "save-credentials" && req.method === "POST") {
      return handleSaveCredentials(supabase, producerId, body as { integrationType?: "MERCADOPAGO" | "STRIPE" | "ASAAS" | "PUSHINPAY"; config?: Record<string, unknown> }, corsHeaders);
    }

    if (action === "disconnect" && (req.method === "DELETE" || req.method === "POST")) {
      return handleDisconnect(supabase, producerId, body as { integrationType?: string; integrationId?: string }, corsHeaders);
    }

    if (action === "init-oauth" && req.method === "POST") {
      return handleInitOAuth(supabase, producerId, body as { integrationType?: string }, corsHeaders);
    }

    if (action === "status" && (req.method === "GET" || req.method === "POST")) {
      const integrationType = (body.integrationType as string) || url.searchParams.get("type");
      return handleGetStatus(supabase, producerId, integrationType, corsHeaders);
    }

    if (action === "save-profile-wallet" && req.method === "POST") {
      return handleSaveProfileWallet(supabase, producerId, body.walletId as string, corsHeaders);
    }

    if (action === "clear-profile-wallet" && req.method === "POST") {
      return handleClearProfileWallet(supabase, producerId, corsHeaders);
    }

    if (action === "update-profile" && req.method === "POST") {
      return handleUpdateProfile(supabase, producerId, body as { name?: string; cpf_cnpj?: string; phone?: string }, corsHeaders);
    }

    return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[integration-management] Unexpected error:", err.message);
    await captureException(err, { functionName: "integration-management", url: req.url, method: req.method });
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
}));
