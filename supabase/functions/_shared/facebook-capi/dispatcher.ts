/**
 * ============================================================================
 * Facebook CAPI Dispatcher
 * ============================================================================
 * 
 * @module _shared/facebook-capi/dispatcher
 * @version 1.1.0 - RISE Protocol V3
 * 
 * Orchestrates CAPI event dispatch:
 * 1. Fetches order data (including ALL items: main + bumps)
 * 2. Resolves active Facebook pixels for the primary product
 * 3. For each pixel, calls facebook-conversion-api with deterministic event_id
 * 4. Aggregates results
 * 
 * v1.1.0: Now includes ALL order items in content_ids and numItems for
 *         accurate Facebook Ads optimization with order bumps.
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { resolveFacebookPixels } from "./pixel-resolver.ts";
import { generatePurchaseEventId, generateGenericEventId } from "./event-id.ts";
import type {
  FacebookCAPIDispatchResult,
  FacebookCAPIPixelResult,
  FacebookCAPIPayload,
  FacebookCAPIOrderData,
} from "./types.ts";

const log = createLogger("FacebookCAPIDispatcher");

/**
 * Fetches order data needed for CAPI dispatch.
 * Includes all order items (main product + order bumps) for accurate content_ids.
 */
async function fetchOrderForCAPI(
  supabase: SupabaseClient,
  orderId: string
): Promise<FacebookCAPIOrderData | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, vendor_id, amount_cents, payment_method,
      customer_email, customer_name, customer_phone,
      order_items (product_id, product_name, is_bump)
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      log.warn(`Order ${orderId} not found for Facebook CAPI`);
    } else {
      log.error(`SQL error fetching order ${orderId}:`, {
        code: error.code,
        message: error.message,
      });
    }
    return null;
  }

  if (!data) return null;

  // Map all order items with bump flag
  const rawItems = (data.order_items as Array<{
    product_id: string;
    product_name: string | null;
    is_bump: boolean;
  }>) || [];

  const items = rawItems.map(item => ({
    productId: item.product_id,
    productName: item.product_name,
    isBump: item.is_bump ?? false,
  }));

  // Primary product is the first non-bump item (used for pixel resolution)
  const primaryItem = items.find(item => !item.isBump) || items[0];

  return {
    orderId: data.id,
    vendorId: data.vendor_id,
    primaryProductId: primaryItem?.productId || '',
    items,
    amountCents: data.amount_cents,
    customerEmail: data.customer_email,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    paymentMethod: data.payment_method || 'unknown',
  };
}

/**
 * Sends a CAPI event to facebook-conversion-api edge function
 */
async function sendCAPIEvent(
  payload: FacebookCAPIPayload
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return { success: false, error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" };
  }

  const url = `${supabaseUrl}/functions/v1/facebook-conversion-api`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    return {
      success: false,
      error: result.error || `HTTP ${response.status}`,
    };
  }

  return { success: true };
}

/**
 * Dispatches Facebook CAPI event for an order.
 * 
 * 1. Fetches order data
 * 2. Resolves Facebook pixels for the product
 * 3. Sends CAPI event to each pixel with deterministic event_id
 * 4. Returns aggregated result
 * 
 * @param supabase - Supabase client with service role
 * @param orderId - The order ID
 * @param eventName - Facebook event name (e.g., 'Purchase')
 * @param paymentMethod - Payment method for fire_on_* filtering
 * @returns Aggregated dispatch result
 */
export async function dispatchFacebookCAPIForOrder(
  supabase: SupabaseClient,
  orderId: string,
  eventName: string,
  paymentMethod: string
): Promise<FacebookCAPIDispatchResult> {
  // 1. Fetch order data
  const order = await fetchOrderForCAPI(supabase, orderId);
  if (!order) {
    return {
      success: true,
      skipped: true,
      reason: "order_not_found",
      totalPixels: 0,
      successCount: 0,
      failedCount: 0,
      pixelResults: [],
    };
  }

  if (!order.primaryProductId) {
    return {
      success: true,
      skipped: true,
      reason: "no_product_id",
      totalPixels: 0,
      successCount: 0,
      failedCount: 0,
      pixelResults: [],
    };
  }

  // 2. Resolve Facebook pixels (using primary product)
  const pixels = await resolveFacebookPixels(
    supabase,
    order.primaryProductId,
    paymentMethod
  );

  if (pixels.length === 0) {
    return {
      success: true,
      skipped: true,
      reason: "no_facebook_pixels",
      totalPixels: 0,
      successCount: 0,
      failedCount: 0,
      pixelResults: [],
    };
  }

  // 3. Generate event_id (deterministic for Purchase)
  const eventId = eventName === "Purchase"
    ? generatePurchaseEventId(orderId)
    : generateGenericEventId(eventName);

  // 4. Dispatch to each pixel
  const pixelResults: FacebookCAPIPixelResult[] = [];

  // Calculate value in reals
  const valueInReals = order.amountCents / 100;

  // Parse customer name into first/last
  const nameParts = (order.customerName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1
    ? nameParts.slice(1).join(' ')
    : undefined;

  // Extract content IDs from ALL items (main + bumps)
  const contentIds = order.items.map(item => item.productId);
  const numItems = order.items.length;
  
  // Get primary product name for content_name
  const primaryItem = order.items.find(item => !item.isBump);
  const contentName = primaryItem?.productName || order.items[0]?.productName || undefined;

  for (const pixel of pixels) {
    // Apply custom value percentage if configured
    const finalValue = pixel.customValuePercent
      ? valueInReals * (pixel.customValuePercent / 100)
      : valueInReals;

    const payload: FacebookCAPIPayload = {
      pixelId: pixel.pixelId,
      accessToken: pixel.accessToken,
      eventName,
      eventId,
      eventData: {
        currency: "BRL",
        value: finalValue,
        contentIds,
        contentType: "product",
        contentName,
        orderId: order.orderId,
        numItems,
      },
      userData: {
        email: order.customerEmail,
        phone: order.customerPhone,
        firstName,
        lastName,
      },
    };

    log.info(`Dispatching ${eventName} to pixel ${pixel.pixelId}`, {
      orderId,
      eventId,
      value: finalValue,
      contentIds,
      numItems,
    });

    const result = await sendCAPIEvent(payload);

    pixelResults.push({
      pixelId: pixel.pixelId,
      success: result.success,
      error: result.error,
    });

    if (!result.success) {
      log.warn(`Failed to send ${eventName} to pixel ${pixel.pixelId}:`, result.error);
    }
  }

  const successCount = pixelResults.filter(r => r.success).length;
  const failedCount = pixelResults.filter(r => !r.success).length;

  log.info(`Facebook CAPI dispatch complete for order ${orderId}`, {
    eventName,
    totalPixels: pixels.length,
    successCount,
    failedCount,
  });

  return {
    success: failedCount === 0,
    totalPixels: pixels.length,
    successCount,
    failedCount,
    pixelResults,
  };
}
