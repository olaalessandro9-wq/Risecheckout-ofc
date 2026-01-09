/**
 * Dashboard Analytics Module
 * 
 * Exportação centralizada (barrel export) de todos os recursos
 * relacionados ao dashboard analytics.
 * 
 * USO:
 * import { useDashboardAnalytics, getDateRangeFromPreset, type DateRangePreset } from "@/hooks/dashboard";
 */

// Hook principal
export { useDashboardAnalytics } from "./useDashboardAnalytics";

// Presets de data
export { getDateRangeFromPreset } from "./utils/datePresets";

// Tipos
export type { 
  DateRangePreset,
  DashboardMetrics,
  DashboardData,
  ChartDataPoint,
  RecentCustomer,
  TrendData
} from "./types";

// Utilitários (se necessário em outros lugares)
export { formatCurrency, formatDate, translateStatus } from "./utils/formatters";
