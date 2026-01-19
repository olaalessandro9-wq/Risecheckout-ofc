/**
 * Orders Handler - Fetches chart and recent orders
 * 
 * @module dashboard-analytics/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { OrderRecord } from "../types.ts";

export async function fetchChartOrders(
  supabase: SupabaseClient,
  vendorId: string,
  startDate: string,
  endDate: string,
  _timezone: string
): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      status,
      payment_method,
      amount_cents,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      product:products!orders_product_id_fkey (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .eq("vendor_id", vendorId)
    .eq("status", "paid")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chart orders: ${error.message}`);
  }

  return (data ?? []) as unknown as OrderRecord[];
}

export async function fetchRecentOrders(
  supabase: SupabaseClient,
  vendorId: string,
  startDate: string,
  endDate: string
): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      status,
      payment_method,
      amount_cents,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      product:products!orders_product_id_fkey (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .eq("vendor_id", vendorId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch recent orders: ${error.message}`);
  }

  return (data ?? []) as unknown as OrderRecord[];
}
