/**
 * Funções de cálculo para métricas do Dashboard
 * 
 * @module dashboard/utils
 * @version RISE V3 Compliant
 */

import { format } from "date-fns";
import type {
  DashboardMetrics,
  ChartDataPoint,
  Order,
  RpcDashboardMetrics,
} from "../types";
import { formatCurrency } from "./formatters";

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
  previous: RpcDashboardMetrics
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

  const revenueTrendValue = calculatePercentageChange(
    paidRevenue,
    previousPaidRevenue
  );
  const conversionTrendValue = calculatePercentageChange(
    conversionRate,
    previousConversionRate
  );

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
      label: "vs. período anterior",
    },
    conversionTrend: {
      value: Math.round(Math.abs(conversionTrendValue)),
      isPositive: conversionTrendValue >= 0,
      label: "vs. período anterior",
    },
  };
}

// ============================================================================
// CHART DATA CALCULATION
// ============================================================================

/**
 * Agrupa dados por HORA para gráficos de período de 1 dia
 */
export function calculateHourlyChartData(
  orders: Order[],
  targetDate: Date
): ChartDataPoint[] {
  const hourlyData: ChartDataPoint[] = [];

  for (let hour = 0; hour < 24; hour++) {
    hourlyData.push({
      date: `${hour.toString().padStart(2, "0")}:00`,
      revenue: 0,
      fees: 0,
      emails: 0,
    });
  }

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const hour = orderDate.getHours();

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
 */
export function calculateChartData(
  orders: Order[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  const chartDataMap = new Map<string, ChartDataPoint>();

  orders.forEach((order) => {
    const date = format(new Date(order.created_at), "yyyy-MM-dd");

    if (!chartDataMap.has(date)) {
      chartDataMap.set(date, {
        date,
        revenue: 0,
        fees: 0,
        emails: 0,
      });
    }

    const dataPoint = chartDataMap.get(date)!;

    if (order.status?.toLowerCase() === "paid") {
      dataPoint.revenue += (order.amount_cents || 0) / 100;
      const fee = calculateGatewayFee(order.amount_cents || 0);
      dataPoint.fees += fee / 100;
    }

    if (order.customer_email) {
      dataPoint.emails += 1;
    }
  });

  let chartData = Array.from(chartDataMap.values());

  if (chartData.length === 0) {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numPoints = Math.min(Math.max(daysDiff, 7), 30);

    for (let i = 0; i < numPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor((i * daysDiff) / numPoints));
      chartData.push({
        date: format(date, "yyyy-MM-dd"),
        revenue: 0,
        fees: 0,
        emails: 0,
      });
    }
  }

  chartData.sort((a, b) => a.date.localeCompare(b.date));

  return chartData;
}
