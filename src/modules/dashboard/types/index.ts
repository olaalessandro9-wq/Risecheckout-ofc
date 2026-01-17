/**
 * Barrel export para tipos do Dashboard
 * 
 * @module dashboard/types
 */

export type {
  // Date Range
  DateRangePreset,
  DateRangeState,
  DateRangeAction,
  DateRange,
  DatePresetConfig,
  
  // Metrics
  TrendData,
  DashboardMetrics,
  MetricConfig,
  MetricColorConfig,
  MetricColorScheme,
  
  // Chart
  ChartDataPoint,
  
  // Customer
  RecentCustomer,
  
  // Order
  Order,
  OrderProduct,
  
  // RPC
  RpcDashboardMetrics,
  
  // Dashboard Data
  DashboardData,
  
  // Overview
  OverviewItemConfig,
} from "./dashboard.types";
