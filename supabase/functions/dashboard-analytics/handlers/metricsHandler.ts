/**
 * Metrics Handler - Fetches aggregated dashboard metrics via RPC
 * 
 * @module dashboard-analytics/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { RpcDashboardMetrics } from "../types.ts";

const DEFAULT_METRICS: RpcDashboardMetrics = {
  paid_count: 0,
  pending_count: 0,
  total_count: 0,
  paid_revenue_cents: 0,
  pending_revenue_cents: 0,
  total_revenue_cents: 0,
  pix_revenue_cents: 0,
  credit_card_revenue_cents: 0,
  fees_cents: 0,
};

export async function fetchMetrics(
  supabase: SupabaseClient,
  vendorId: string,
  startDate: string,
  endDate: string,
  timezone: string
): Promise<RpcDashboardMetrics> {
  const { data, error } = await supabase.rpc("get_dashboard_metrics", {
    p_vendor_id: vendorId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_timezone: timezone,
  });

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return DEFAULT_METRICS;
  }

  const row = data[0];
  return {
    paid_count: Number(row.paid_count) || 0,
    pending_count: Number(row.pending_count) || 0,
    total_count: Number(row.total_count) || 0,
    paid_revenue_cents: Number(row.paid_revenue_cents) || 0,
    pending_revenue_cents: Number(row.pending_revenue_cents) || 0,
    total_revenue_cents: Number(row.total_revenue_cents) || 0,
    pix_revenue_cents: Number(row.pix_revenue_cents) || 0,
    credit_card_revenue_cents: Number(row.credit_card_revenue_cents) || 0,
    fees_cents: Number(row.fees_cents) || 0,
  };
}
