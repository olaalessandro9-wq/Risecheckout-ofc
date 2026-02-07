/**
 * Barrel export para utils do Dashboard
 * 
 * @module dashboard/utils
 */

export {
  formatCurrency,
  formatDate,
  translateStatus,
  formatDocument,
  formatRecentCustomers,
} from "./formatters";

export {
  calculatePercentageChange,
  calculateGatewayFee,
  calculateMetricsFromRpc,
  calculateHourlyChartData,
  calculateChartData,
} from "./calculations";

export {
  detectTimeMode,
  calculateXAxisConfig,
  formatTooltipLabel,
} from "./chartAxisUtils";

export type { ChartTimeMode } from "./chartAxisUtils";
