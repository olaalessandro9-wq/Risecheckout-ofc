/**
 * Shared Test Utilities for dashboard-analytics
 * 
 * @module dashboard-analytics/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================
// CONSTANTS
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/dashboard-analytics";
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export const SUPPORTED_ACTIONS = ["full"] as const;
export type SupportedAction = typeof SUPPORTED_ACTIONS[number];

// ============================================
// TYPES
// ============================================

export interface MockProducer {
  id: string;
  email: string;
  name?: string;
}

export interface DashboardRequest {
  action: SupportedAction | string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

export interface CurrentMetrics {
  paid_count: number;
  paid_revenue_cents: number;
  pending_count?: number;
  pending_revenue_cents?: number;
}

export interface ChartOrder {
  date: string;
  count: number;
  revenue_cents: number;
}

export interface RecentOrder {
  id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  };
}

export function createMockRequest(body: Partial<DashboardRequest>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutAuth(body: Partial<DashboardRequest>): Request {
  return new Request(FUNCTION_URL, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  });
}

export function createDefaultProducer(): MockProducer {
  return {
    id: "producer-123",
    email: "test@example.com",
    name: "Test Producer",
  };
}

export function createDefaultMetrics(): CurrentMetrics {
  return {
    paid_count: 10,
    paid_revenue_cents: 100000,
    pending_count: 5,
    pending_revenue_cents: 50000,
  };
}

export function createChartOrder(overrides?: Partial<ChartOrder>): ChartOrder {
  return {
    date: "2025-01-15",
    count: 5,
    revenue_cents: 50000,
    ...overrides,
  };
}

export function createRecentOrder(overrides?: Partial<RecentOrder>): RecentOrder {
  return {
    id: "order-123",
    customer_email: "customer@example.com",
    total_amount: 9900,
    status: "paid",
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isSupportedAction(value: string): value is SupportedAction {
  return SUPPORTED_ACTIONS.includes(value as SupportedAction);
}

// ============================================
// TEST HELPERS
// ============================================

export function createDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}
