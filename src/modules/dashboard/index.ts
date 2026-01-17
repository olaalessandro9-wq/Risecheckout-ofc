/**
 * Dashboard Module - Barrel Export
 * 
 * @module dashboard
 * @version RISE V3 Compliant
 * 
 * Exportação centralizada de todo o módulo Dashboard.
 * 
 * USO:
 * import { Dashboard, useDashboard } from "@/modules/dashboard";
 */

// Pages
export { Dashboard } from "./pages";

// Hooks
export { useDashboard, useDateRangeState, useDashboardAnalytics } from "./hooks";
export type { DateRangeActions } from "./hooks";

// Components
export {
  DashboardHeader,
  DateRangeFilter,
  MetricsGrid,
  MetricCard,
  OverviewPanel,
  RevenueChart,
} from "./components";

// Config
export {
  DATE_PRESETS,
  getPresetLabel,
  DASHBOARD_METRICS_CONFIG,
  METRIC_COLORS,
  getMetricColorClasses,
  OVERVIEW_ITEMS_CONFIG,
  OVERVIEW_COLORS,
  getOverviewColorClasses,
} from "./config";

// State
export { dateRangeReducer, createInitialDateRangeState } from "./state";

// Types
export type {
  DateRangePreset,
  DateRangeState,
  DateRangeAction,
  DateRange,
  DatePresetConfig,
  TrendData,
  DashboardMetrics,
  MetricConfig,
  MetricColorConfig,
  MetricColorScheme,
  ChartDataPoint,
  RecentCustomer,
  Order,
  OrderProduct,
  RpcDashboardMetrics,
  DashboardData,
  OverviewItemConfig,
} from "./types";

// Utils
export {
  formatCurrency,
  formatDate,
  translateStatus,
  formatDocument,
  formatRecentCustomers,
  calculateMetricsFromRpc,
  calculateChartData,
  calculateHourlyChartData,
} from "./utils";

// API
export {
  fetchAggregatedMetrics,
  fetchRecentOrders,
  fetchChartOrders,
} from "./api";
