/**
 * affiliation-public Edge Function
 * 
 * PUBLIC endpoint - no authentication required
 * Fetches public data for affiliation request pages
 * 
 * Actions:
 * - product: Get product with affiliate settings
 * - offers: Get active offers for a product
 * 
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

interface RequestBody {
  action: "product" | "offers" | "all";
  productId: string;
}

interface AffiliateSettings {
  enabled: boolean;
  defaultRate: number;
  cookieDuration: number;
  allowUpsells?: boolean;
  commissionOnOrderBump?: boolean;
  commissionOnUpsell?: boolean;
  supportEmail?: string;
  publicDescription?: string;
  attributionModel: string;
  requireApproval: boolean;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { action, productId } = body;

    if (!productId) {
      return jsonResponse({ error: "productId required" }, 400);
    }

    console.log(`[affiliation-public] Action: ${action}, Product: ${productId}`);

    // ===== ACTION: product =====
    if (action === "product") {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, affiliate_settings")
        .eq("id", productId)
        .single();

      if (error || !data) {
        console.error("[affiliation-public] Product not found:", error);
        return jsonResponse({ error: "Produto não encontrado" }, 404);
      }

      const settings = data.affiliate_settings as AffiliateSettings | null;
      if (!settings?.enabled) {
        return jsonResponse({ 
          error: "Este produto não possui programa de afiliados ativo." 
        }, 400);
      }

      return jsonResponse({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          image_url: data.image_url,
          affiliate_settings: settings,
        },
      });
    }

    // ===== ACTION: offers =====
    if (action === "offers") {
      const { data, error } = await supabase
        .from("offers")
        .select("id, name, price")
        .eq("product_id", productId)
        .eq("status", "active");

      if (error) {
        console.error("[affiliation-public] Offers error:", error);
        return jsonResponse({ success: true, data: [] });
      }

      // Convert price from cents to reais
      const offers = (data || []).map((offer: { id: string; name: string; price: number }) => ({
        id: offer.id,
        name: offer.name,
        price: (parseFloat(String(offer.price)) || 0) / 100,
      }));

      return jsonResponse({ success: true, data: offers });
    }

    // ===== ACTION: all =====
    if (action === "all") {
      const [productResult, offersResult] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, image_url, affiliate_settings")
          .eq("id", productId)
          .single(),
        supabase
          .from("offers")
          .select("id, name, price")
          .eq("product_id", productId)
          .eq("status", "active"),
      ]);

      if (productResult.error || !productResult.data) {
        return jsonResponse({ error: "Produto não encontrado" }, 404);
      }

      const settings = productResult.data.affiliate_settings as AffiliateSettings | null;
      if (!settings?.enabled) {
        return jsonResponse({ 
          error: "Este produto não possui programa de afiliados ativo." 
        }, 400);
      }

      const offers = (offersResult.data || []).map((offer: { id: string; name: string; price: number }) => ({
        id: offer.id,
        name: offer.name,
        price: (parseFloat(String(offer.price)) || 0) / 100,
      }));

      return jsonResponse({
        success: true,
        data: {
          product: {
            id: productResult.data.id,
            name: productResult.data.name,
            image_url: productResult.data.image_url,
            affiliate_settings: settings,
          },
          offers,
        },
      });
    }

    return jsonResponse({ error: "Ação desconhecida" }, 400);

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[affiliation-public] Error:", err.message);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
