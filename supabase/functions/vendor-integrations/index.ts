/**
 * vendor-integrations Edge Function
 * 
 * PUBLIC endpoint - fetches vendor integration configs
 * Used by checkout pages to determine available payment gateways
 * 
 * Actions:
 * - get-config: Get integration config by vendor ID and type
 * - get-all: Get all active integrations for a vendor
 * 
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("vendor-integrations");

interface RequestBody {
  action: "get-config" | "get-all";
  vendorId: string;
  integrationType?: "MERCADOPAGO" | "PUSHINPAY" | "STRIPE" | "ASAAS" | "TIKTOK_PIXEL" | "FACEBOOK_PIXEL" | "GOOGLE_ADS" | "UTMIFY";
}

// Variable to hold corsHeaders in scope for helper functions
let currentCorsHeaders: Record<string, string> = {};

serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;
  currentCorsHeaders = corsHeaders;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { action, vendorId, integrationType } = body;

    if (!vendorId) {
      return jsonResponse({ error: "vendorId required" }, 400);
    }

    log.info(`Action: ${action}, Vendor: ${vendorId}, Type: ${integrationType || "all"}`);

    // ===== ACTION: get-config =====
    if (action === "get-config") {
      if (!integrationType) {
        return jsonResponse({ error: "integrationType required" }, 400);
      }

      const { data, error } = await supabase
        .from("vendor_integrations")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("integration_type", integrationType)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        // PGRST116 = row not found (not critical)
        if (error.code === "PGRST116") {
          return jsonResponse({ success: true, data: null });
        }
        log.error("Error:", error);
        return jsonResponse({ error: "Erro ao buscar integração" }, 500);
      }

      if (!data || !data.active) {
        return jsonResponse({ success: true, data: null });
      }

      // Remove sensitive data for public response
      const safeConfig = sanitizeConfig(data.config, integrationType);

      return jsonResponse({
        success: true,
        data: {
          id: data.id,
          vendor_id: data.vendor_id,
          integration_type: data.integration_type,
          active: data.active,
          config: safeConfig,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      });
    }

    // ===== ACTION: get-all =====
    if (action === "get-all") {
      const { data, error } = await supabase
        .from("vendor_integrations")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("active", true);

      if (error) {
        log.error("Error:", error);
        return jsonResponse({ error: "Erro ao buscar integrações" }, 500);
      }

      const integrations = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        vendor_id: item.vendor_id,
        integration_type: item.integration_type,
        active: item.active,
        config: sanitizeConfig(item.config as Record<string, unknown>, item.integration_type as string),
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      return jsonResponse({ success: true, data: integrations });
    }

    return jsonResponse({ error: "Ação desconhecida" }, 400);

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error("Error:", err.message);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});

/**
 * Remove sensitive data from config based on integration type
 */
function sanitizeConfig(config: Record<string, unknown> | unknown, integrationType: string): Record<string, unknown> {
  if (!config || typeof config !== "object") return {};
  
  const cfg = config as Record<string, unknown>;
  
  switch (integrationType) {
    case "MERCADOPAGO":
      return {
        public_key: cfg.public_key,
        sandbox_mode: cfg.sandbox_mode,
      };
    case "STRIPE":
      return {
        publishable_key: cfg.publishable_key,
      };
    case "PUSHINPAY":
      return {
        has_token: !!cfg.pushinpay_token,
      };
    case "ASAAS":
      return {
        sandbox_mode: cfg.sandbox_mode,
        environment: cfg.environment,
        has_api_key: !!cfg.api_key,
      };
    case "TIKTOK_PIXEL":
      return {
        pixel_id: cfg.pixel_id,
        selected_products: cfg.selected_products,
      };
    case "FACEBOOK_PIXEL":
      return {
        pixel_id: cfg.pixel_id,
        selected_products: cfg.selected_products,
      };
    case "GOOGLE_ADS":
      return {
        conversion_id: cfg.conversion_id,
        conversion_label: cfg.conversion_label,
        selected_products: cfg.selected_products,
      };
    case "UTMIFY":
      return {
        api_token: cfg.api_token ? "configured" : null,
        selected_products: cfg.selected_products,
      };
    default:
      return {};
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...currentCorsHeaders, "Content-Type": "application/json" },
  });
}
