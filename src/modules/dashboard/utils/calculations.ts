/**
 * Funções de cálculo para métricas do Dashboard
 * 
 * @module dashboard/utils
 * @version 2.0.0 - RISE V3 Compliant (Timezone Support)
 */

import { timezoneService } from "@/lib/timezone";
import type {
  DashboardMetrics,
  ChartDataPoint,
  Order,
  RpcDashboardMetrics,
  DateRangePreset,
} from "../types";
import { formatCurrency } from "./formatters";

// ============================================================================
// TREND LABEL MAPPING
// ============================================================================

/**
 * Retorna o label de comparação baseado no preset selecionado
 */
function getTrendLabel(preset: DateRangePreset): string {
  const labels: Record<DateRangePreset, string> = {
    today: "vs. ontem",
    yesterday: "vs. dia anterior",
    "7days": "vs. semana anterior",
    "30days": "vs. mês anterior",
    max: "total",
    custom: "vs. período anterior",
  };
  return labels[preset];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calcula a taxa de gateway (3.99% + R$ 0,39 por transação)
 */
export function calculateGatewayFee(amountCents: number): number {
  return Math.round(amountCents * 0.0399) + 39;
}

// ============================================================================
// METRICS FROM RPC
// ============================================================================

/**
 * Calcula métricas do dashboard usando dados agregados do RPC
 */
export function calculateMetricsFromRpc(
  current: RpcDashboardMetrics,
  previous: RpcDashboardMetrics,
  preset: DateRangePreset
): DashboardMetrics {
  const paidRevenue = current.paid_revenue_cents || 0;
  const pendingRevenue = current.pending_revenue_cents || 0;
  const totalRevenue = current.total_revenue_cents || 0;
  const paidCount = current.paid_count || 0;
  const pendingCount = current.pending_count || 0;
  const totalCount = current.total_count || 0;
  const totalFees = current.fees_cents || 0;
  const pixRevenue = current.pix_revenue_cents || 0;
  const creditCardRevenue = current.credit_card_revenue_cents || 0;

  const previousPaidRevenue = previous.paid_revenue_cents || 0;
  const previousPendingRevenue = previous.pending_revenue_cents || 0;
  const previousPaidCount = previous.paid_count || 0;
  const previousTotalCount = previous.total_count || 0;

  const averageTicketCents =
    paidCount > 0 ? Math.round(paidRevenue / paidCount) : 0;

  const conversionRate =
    totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  const previousConversionRate =
    previousTotalCount > 0
      ? (previousPaidCount / previousTotalCount) * 100
      : 0;

  // Calcular trends para todas as métricas
  const revenueTrendValue = calculatePercentageChange(paidRevenue, previousPaidRevenue);
  const paidRevenueTrendValue = calculatePercentageChange(paidRevenue, previousPaidRevenue);
  const pendingRevenueTrendValue = calculatePercentageChange(pendingRevenue, previousPendingRevenue);
  const conversionTrendValue = calculatePercentageChange(conversionRate, previousConversionRate);

  const trendLabel = getTrendLabel(preset);

  return {
    totalRevenue: formatCurrency(totalRevenue),
    paidRevenue: formatCurrency(paidRevenue),
    pendingRevenue: formatCurrency(pendingRevenue),
    totalFees: formatCurrency(totalFees),
    checkoutsStarted: totalCount,
    totalPaidOrders: paidCount,
    totalPendingOrders: pendingCount,
    conversionRate: `${conversionRate.toFixed(2)}%`,
    averageTicket: formatCurrency(averageTicketCents),
    pixRevenue: formatCurrency(pixRevenue),
    creditCardRevenue: formatCurrency(creditCardRevenue),
    revenueTrend: {
      value: Math.round(Math.abs(revenueTrendValue)),
      isPositive: revenueTrendValue >= 0,
      label: trendLabel,
    },
    paidRevenueTrend: {
      value: Math.round(Math.abs(paidRevenueTrendValue)),
      isPositive: paidRevenueTrendValue >= 0,
      label: trendLabel,
    },
    pendingRevenueTrend: {
      value: Math.round(Math.abs(pendingRevenueTrendValue)),
      isPositive: pendingRevenueTrendValue >= 0,
      label: trendLabel,
    },
    conversionTrend: {
      value: Math.round(Math.abs(conversionTrendValue)),
      isPositive: conversionTrendValue >= 0,
      label: trendLabel,
    },
  };
}

// ============================================================================
// CHART DATA CALCULATION
// ============================================================================

/**
 * Agrupa dados por HORA para gráficos de período de 1 dia
 * 
 * Uses TimezoneService to get the correct hour in São Paulo timezone.
 * This ensures a sale at 00:50 UTC (21:50 SP) appears in the 21h bar.
 */
export function calculateHourlyChartData(
  orders: Order[],
  targetDate: Date
): ChartDataPoint[] {
  const hourlyData: ChartDataPoint[] = [];

  // Initialize all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData.push({
      date: `${hour.toString().padStart(2, "0")}:00`,
      revenue: 0,
      fees: 0,
      emails: 0,
    });
  }

  orders.forEach((order) => {
    // Use timezone service to get the correct hour in São Paulo
    const hour = timezoneService.getHourInTimezone(order.created_at);

    if (order.status?.toLowerCase() === "paid") {
      hourlyData[hour].revenue += (order.amount_cents || 0) / 100;
      hourlyData[hour].fees +=
        calculateGatewayFee(order.amount_cents || 0) / 100;
    }

    if (order.customer_email) {
      hourlyData[hour].emails += 1;
    }
  });

  return hourlyData;
}

/**
 * Agrupa dados por dia para os gráficos
 * 
 * Uses TimezoneService to get the correct date in São Paulo timezone.
 * This ensures a sale at 00:50 UTC on Jan 16 (21:50 SP Jan 15) 
 * appears on Jan 15 in the chart.
 */
export function calculateChartData(
  orders: Order[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  // Step 1: Pre-allocate ALL days in the range with zero values
  // Same pattern as calculateHourlyChartData (which pre-allocates all 24 hours)
  const chartDataMap = new Map<string, ChartDataPoint>();
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = timezoneService.getDateInTimezone(current);

    if (!chartDataMap.has(dateKey)) {
      chartDataMap.set(dateKey, {
        date: dateKey,
        revenue: 0,
        fees: 0,
        emails: 0,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  // Step 2: Accumulate order data into the pre-allocated slots
  orders.forEach((order) => {
    const date = timezoneService.getDateInTimezone(order.created_at);
    const dataPoint = chartDataMap.get(date);

    // Only accumulate if the order falls within the pre-allocated range
    if (!dataPoint) return;

    if (order.status?.toLowerCase() === "paid") {
      dataPoint.revenue += (order.amount_cents || 0) / 100;
      const fee = calculateGatewayFee(order.amount_cents || 0);
      dataPoint.fees += fee / 100;
    }

    if (order.customer_email) {
      dataPoint.emails += 1;
    }
  });

  // Step 3: Convert to array (Map preserves insertion order = chronological)
  return Array.from(chartDataMap.values());
}
