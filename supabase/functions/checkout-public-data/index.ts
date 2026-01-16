/**
 * checkout-public-data Edge Function
 * 
 * PUBLIC endpoint - no authentication required
 * Fetches data needed to render public checkout pages
 * 
 * Actions:
 * - product: Get product data by ID
 * - offer: Get offer data by checkout ID  
 * - order-bumps: Get active order bumps for a checkout
 * - affiliate: Get affiliate info
 * - all: Get all checkout data in one call
 * 
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "product" | "offer" | "order-bumps" | "affiliate" | "all" | "validate-coupon" | "get-checkout-offer" | "checkout" | "product-pixels" | "order-by-token" | "payment-link-data";
  productId?: string;
  checkoutId?: string;
  affiliateCode?: string;
  couponCode?: string;
  orderId?: string;
  token?: string;
  slug?: string;
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
    const { action, productId, checkoutId, affiliateCode } = body;

    console.log(`[checkout-public-data] Action: ${action}`);

    // ===== ACTION: product =====
    if (action === "product") {
      if (!productId) {
        return jsonResponse({ error: "productId required" }, 400);
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          user_id,
          name,
          description,
          price,
          image_url,
          support_name,
          required_fields,
          default_payment_method,
          upsell_settings,
          affiliate_settings,
          status,
          pix_gateway,
          credit_card_gateway
        `)
        .eq("id", productId)
        .maybeSingle();

      if (error || !data) {
        console.error("[checkout-public-data] Product not found:", error);
        return jsonResponse({ error: "Produto não encontrado" }, 404);
      }

      if (data.status === "deleted" || data.status === "blocked") {
        return jsonResponse({ error: "Produto não disponível" }, 404);
      }

      return jsonResponse({ success: true, data });
    }

    // ===== ACTION: offer =====
    if (action === "offer") {
      if (!checkoutId) {
        return jsonResponse({ error: "checkoutId required" }, 400);
      }

      const { data, error } = await supabase
        .from("checkout_links")
        .select(`
          link_id,
          payment_links!inner (
            offer_id,
            offers!inner (
              id,
              name,
              price
            )
          )
        `)
        .eq("checkout_id", checkoutId)
        .maybeSingle();

      if (error || !data) {
        console.error("[checkout-public-data] Offer not found:", error);
        return jsonResponse({ error: "Oferta não encontrada" }, 404);
      }

      const paymentLinks = data.payment_links as {
        offer_id: string;
        offers: { id: string; name: string; price: number };
      };

      return jsonResponse({
        success: true,
        data: {
          offerId: paymentLinks.offer_id,
          offerName: paymentLinks.offers.name,
          offerPrice: paymentLinks.offers.price,
        },
      });
    }

    // ===== ACTION: order-bumps =====
    if (action === "order-bumps") {
      if (!checkoutId) {
        return jsonResponse({ error: "checkoutId required" }, 400);
      }

      const { data, error } = await supabase
        .from("order_bumps")
        .select(`
          id,
          product_id,
          custom_title,
          custom_description,
          discount_enabled,
          discount_price,
          show_image,
          call_to_action,
          products(id, name, description, price, image_url),
          offers(id, name, price)
        `)
        .eq("checkout_id", checkoutId)
        .eq("active", true)
        .order("position");

      if (error) {
        console.error("[checkout-public-data] Order bumps error:", error);
        return jsonResponse({ success: true, data: [] });
      }

      // Format order bumps
      const formatted = (data || []).map((bump: Record<string, unknown>) => {
        const product = bump.products as { id: string; name: string; description: string | null; price: number; image_url: string | null } | null;
        const offer = bump.offers as { id: string; name: string; price: number } | null;
        
        const priceInCents = offer?.price ? Number(offer.price) : (product?.price || 0);
        let price = priceInCents;
        let originalPrice: number | null = null;
        
        if (bump.discount_enabled && bump.discount_price) {
          originalPrice = price;
          price = Number(bump.discount_price);
        }

        return {
          id: bump.id,
          product_id: bump.product_id,
          name: bump.custom_title || product?.name || "Oferta Especial",
          description: bump.custom_description || product?.description || "",
          price,
          original_price: originalPrice,
          image_url: bump.show_image ? product?.image_url : null,
          call_to_action: bump.call_to_action,
          product,
          offer,
        };
      });

      return jsonResponse({ success: true, data: formatted });
    }

    // ===== ACTION: affiliate =====
    if (action === "affiliate") {
      if (!affiliateCode || !productId) {
        return jsonResponse({ success: true, data: null });
      }

      const { data, error } = await supabase
        .from("affiliates")
        .select("id, affiliate_code, user_id, commission_rate")
        .eq("affiliate_code", affiliateCode)
        .eq("product_id", productId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        return jsonResponse({ success: true, data: null });
      }

      return jsonResponse({
        success: true,
        data: {
          affiliateId: data.id,
          affiliateCode: data.affiliate_code,
          affiliateUserId: data.user_id,
          commissionRate: data.commission_rate,
        },
      });
    }

    // ===== ACTION: all (batch fetch) =====
    if (action === "all") {
      if (!productId || !checkoutId) {
        return jsonResponse({ error: "productId and checkoutId required" }, 400);
      }

      // Fetch all in parallel
      const [productResult, offerResult, orderBumpsResult] = await Promise.all([
        supabase
          .from("products")
          .select(`id, user_id, name, description, price, image_url, support_name, required_fields, default_payment_method, upsell_settings, affiliate_settings, status, pix_gateway, credit_card_gateway`)
          .eq("id", productId)
          .maybeSingle(),
        supabase
          .from("checkout_links")
          .select(`link_id, payment_links!inner (offer_id, offers!inner (id, name, price))`)
          .eq("checkout_id", checkoutId)
          .maybeSingle(),
        supabase
          .from("order_bumps")
          .select(`id, product_id, custom_title, custom_description, discount_enabled, discount_price, show_image, call_to_action, products(id, name, description, price, image_url), offers(id, name, price)`)
          .eq("checkout_id", checkoutId)
          .eq("active", true)
          .order("position"),
      ]);

      // Process product
      const product = productResult.data;
      if (!product || product.status === "deleted" || product.status === "blocked") {
        return jsonResponse({ error: "Produto não encontrado" }, 404);
      }

      // Process offer
      let offer = null;
      if (offerResult.data) {
        const pl = offerResult.data.payment_links as { offer_id: string; offers: { id: string; name: string; price: number } };
        offer = {
          offerId: pl.offer_id,
          offerName: pl.offers.name,
          offerPrice: pl.offers.price,
        };
      }

      // Process order bumps
      const orderBumps = (orderBumpsResult.data || []).map((bump: Record<string, unknown>) => {
        const prod = bump.products as { id: string; name: string; description: string | null; price: number; image_url: string | null } | null;
        const off = bump.offers as { id: string; name: string; price: number } | null;
        const priceInCents = off?.price ? Number(off.price) : (prod?.price || 0);
        let price = priceInCents;
        let originalPrice: number | null = null;
        if (bump.discount_enabled && bump.discount_price) {
          originalPrice = price;
          price = Number(bump.discount_price);
        }
        return {
          id: bump.id,
          product_id: bump.product_id,
          name: bump.custom_title || prod?.name || "Oferta Especial",
          description: bump.custom_description || prod?.description || "",
          price,
          original_price: originalPrice,
          image_url: bump.show_image ? prod?.image_url : null,
          call_to_action: bump.call_to_action,
          product: prod,
          offer: off,
        };
      });

      return jsonResponse({
        success: true,
        data: { product, offer, orderBumps },
      });
    }

    // ===== ACTION: validate-coupon =====
    if (action === "validate-coupon") {
      const couponCode = body.couponCode;
      if (!couponCode || !productId) {
        return jsonResponse({ error: "couponCode and productId required" }, 400);
      }

      // 1. Fetch coupon by code (case-insensitive)
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", couponCode.trim())
        .single();

      if (couponError || !coupon) {
        return jsonResponse({ error: "Cupom inválido ou não encontrado" }, 400);
      }

      if (!coupon.active) {
        return jsonResponse({ error: "Este cupom está inativo" }, 400);
      }

      // 2. Check if coupon is linked to this product
      const { data: couponProduct, error: cpError } = await supabase
        .from("coupon_products")
        .select("*")
        .eq("coupon_id", coupon.id)
        .eq("product_id", productId)
        .single();

      if (cpError || !couponProduct) {
        return jsonResponse({ error: "Este cupom não é válido para este produto" }, 400);
      }

      // 3. Check start date
      if (coupon.start_date) {
        const startDate = new Date(coupon.start_date);
        if (new Date() < startDate) {
          return jsonResponse({ error: "Este cupom ainda não está ativo" }, 400);
        }
      }

      // 4. Check expiration
      if (coupon.expires_at) {
        const expiresAt = new Date(coupon.expires_at);
        if (new Date() > expiresAt) {
          return jsonResponse({ error: "Este cupom expirou" }, 400);
        }
      }

      // 5. Check usage limit
      if (coupon.max_uses && coupon.max_uses > 0) {
        if ((coupon.uses_count ?? 0) >= coupon.max_uses) {
          return jsonResponse({ error: "Este cupom atingiu o limite de usos" }, 400);
        }
      }

      // Valid coupon!
      return jsonResponse({
        success: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name || coupon.code,
          discount_type: coupon.discount_type,
          discount_value: Number(coupon.discount_value),
          apply_to_order_bumps: coupon.apply_to_order_bumps || false,
        },
      });
    }

    // ===== ACTION: get-checkout-offer (for checkout config) =====
    if (action === "get-checkout-offer") {
      if (!checkoutId) {
        return jsonResponse({ error: "checkoutId required" }, 400);
      }

      const { data, error } = await supabase
        .from("checkout_links")
        .select(`
          link_id,
          payment_links (
            offer_id
          )
        `)
        .eq("checkout_id", checkoutId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[checkout-public-data] Get checkout offer error:", error);
        return jsonResponse({ offerId: "" });
      }

      const paymentLinks = data?.payment_links as { offer_id: string } | null;
      return jsonResponse({ offerId: paymentLinks?.offer_id || "" });
    }

    // ===== ACTION: checkout (fetch full checkout data) =====
    if (action === "checkout") {
      if (!checkoutId) {
        return jsonResponse({ error: "checkoutId required" }, 400);
      }

      const { data, error } = await supabase
        .from("checkouts")
        .select(`
          id,
          name,
          slug,
          visits_count,
          seller_name,
          product_id,
          font,
          background_color,
          text_color,
          primary_color,
          button_color,
          button_text_color,
          components,
          top_components,
          bottom_components,
          status,
          design,
          theme,
          pix_gateway,
          credit_card_gateway,
          mercadopago_public_key,
          stripe_public_key
        `)
        .eq("id", checkoutId)
        .maybeSingle();

      if (error || !data) {
        console.error("[checkout-public-data] Checkout not found:", error);
        return jsonResponse({ error: "Checkout não encontrado" }, 404);
      }

      if (data.status === "deleted") {
        return jsonResponse({ error: "Checkout não disponível" }, 404);
      }

      return jsonResponse({ success: true, data });
    }

    // ===== ACTION: product-pixels (fetch pixels for product) =====
    if (action === "product-pixels") {
      if (!productId) {
        return jsonResponse({ error: "productId required" }, 400);
      }

      // Fetch pixel links for this product
      const { data: links, error: linksError } = await supabase
        .from("product_pixels")
        .select(`
          pixel_id,
          fire_on_initiate_checkout,
          fire_on_purchase,
          fire_on_pix,
          fire_on_card,
          fire_on_boleto,
          custom_value_percent
        `)
        .eq("product_id", productId);

      if (linksError) {
        console.error("[checkout-public-data] Product pixels links error:", linksError);
        return jsonResponse({ success: true, data: [] });
      }

      if (!links || links.length === 0) {
        return jsonResponse({ success: true, data: [] });
      }

      // Fetch actual pixel data
      const pixelIds = links.map(l => l.pixel_id);
      const { data: pixelsData, error: pixelsError } = await supabase
        .from("vendor_pixels")
        .select("id, platform, pixel_id, access_token, conversion_label, domain, is_active")
        .in("id", pixelIds)
        .eq("is_active", true);

      if (pixelsError) {
        console.error("[checkout-public-data] Pixels data error:", pixelsError);
        return jsonResponse({ success: true, data: [] });
      }

      // Combine data
      const combined = [];
      for (const link of links) {
        const pixel = pixelsData?.find(p => p.id === link.pixel_id);
        if (pixel && pixel.is_active) {
          combined.push({
            id: pixel.id,
            platform: pixel.platform,
            pixel_id: pixel.pixel_id,
            access_token: pixel.access_token,
            conversion_label: pixel.conversion_label,
            domain: pixel.domain,
            is_active: pixel.is_active,
            fire_on_initiate_checkout: link.fire_on_initiate_checkout,
            fire_on_purchase: link.fire_on_purchase,
            fire_on_pix: link.fire_on_pix,
            fire_on_card: link.fire_on_card,
            fire_on_boleto: link.fire_on_boleto,
            custom_value_percent: link.custom_value_percent,
          });
        }
      }

      return jsonResponse({ success: true, data: combined });
    }

    // ===== ACTION: order-by-token (fetch order for success page) =====
    if (action === "order-by-token") {
      const orderId = body.orderId;
      const token = body.token;
      
      if (!orderId || !token) {
        return jsonResponse({ error: "orderId and token required" }, 400);
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          product_id,
          product_name,
          amount_cents,
          customer_email,
          customer_name,
          coupon_code,
          discount_amount_cents,
          order_items (
            id,
            product_name,
            amount_cents,
            is_bump,
            quantity
          ),
          product:products!orders_product_id_fkey (
            members_area_enabled
          )
        `)
        .eq("id", orderId)
        .eq("access_token", token)
        .single();

      if (error || !data) {
        console.error("[checkout-public-data] Order not found:", error);
        return jsonResponse({ error: "Pedido não encontrado" }, 404);
      }

      return jsonResponse({ success: true, data });
    }

    // ===== ACTION: payment-link-data (fetch payment link info for redirect) =====
    if (action === "payment-link-data") {
      const slug = body.slug;
      
      if (!slug) {
        return jsonResponse({ error: "slug required" }, 400);
      }

      const { data, error } = await supabase
        .from("payment_links")
        .select(`
          id,
          slug,
          status,
          offers (
            id,
            product_id,
            products (
              id,
              status,
              support_email
            )
          )
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("[checkout-public-data] Payment link error:", error);
        return jsonResponse({ error: "Link não encontrado" }, 404);
      }

      if (!data) {
        return jsonResponse({ success: true, data: null });
      }

      return jsonResponse({ success: true, data });
    }

    // ===== ACTION: check-order-payment-status (for Stripe PIX polling) =====
    if (action === "check-order-payment-status") {
      const orderId = body.orderId;
      if (!orderId) {
        return jsonResponse({ error: "orderId required" }, 400);
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("status, pix_status")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        console.error("[checkout-public-data] Order check error:", error);
        return jsonResponse({ error: "Erro ao verificar pedido" }, 500);
      }

      if (!order) {
        return jsonResponse({ error: "Pedido não encontrado" }, 404);
      }

      const isPaid = order.status === "PAID" || order.pix_status === "paid";

      return jsonResponse({
        success: true,
        data: {
          status: order.status,
          pix_status: order.pix_status,
          isPaid,
        },
      });
    }

    return jsonResponse({ error: "Ação desconhecida" }, 400);

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[checkout-public-data] Error:", err.message);
    return jsonResponse({ error: "Erro interno" }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
