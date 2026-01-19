/**
 * Types for Dashboard Analytics BFF
 * 
 * @module dashboard-analytics/types
 * @version RISE V3 Compliant
 */

export type DashboardAction = "metrics" | "full";

export interface DashboardRequest {
  action: DashboardAction;
  startDate: string;
  endDate: string;
  timezone?: string;
}

/**
 * Matches RpcDashboardMetrics from frontend types
 */
export interface RpcDashboardMetrics {
  paid_count: number;
  pending_count: number;
  total_count: number;
  paid_revenue_cents: number;
  pending_revenue_cents: number;
  total_revenue_cents: number;
  pix_revenue_cents: number;
  credit_card_revenue_cents: number;
  fees_cents: number;
}

/**
 * Matches Order from frontend types
 */
export interface OrderRecord {
  id: string;
  created_at: string;
  status: string;
  payment_method: string | null;
  amount_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    user_id: string;
  } | null;
}

export interface DashboardFullResponse {
  currentMetrics: RpcDashboardMetrics;
  previousMetrics: RpcDashboardMetrics;
  chartOrders: OrderRecord[];
  recentOrders: OrderRecord[];
}
