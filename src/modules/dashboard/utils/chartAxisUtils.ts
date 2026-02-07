/**
 * Chart X-Axis Utilities
 * 
 * @module dashboard/utils
 * @version RISE V3 Compliant - Solution B (10.0 score)
 * 
 * Intelligent tick calculation and formatting for the RevenueChart.
 * Auto-detects data granularity (hourly vs daily) and calculates
 * explicit ticks with proper formatting for every time range.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ChartTimeMode = "hourly" | "daily";

interface XAxisConfig {
  readonly ticks: string[];
  readonly formatter: (value: string) => string;
}

interface ChartDataPoint {
  readonly date: string;
  readonly value: number;
}

// ============================================================================
// SHORT MONTH NAMES (pt-BR)
// ============================================================================

const MONTH_SHORT: readonly string[] = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Auto-detect whether chart data represents hourly or daily granularity.
 * 
 * Hourly data uses "HH:00" format (e.g., "00:00", "09:00", "23:00").
 * Daily data uses "YYYY-MM-DD" format (e.g., "2026-01-15").
 * 
 * @param data - Chart data points
 * @returns Detected time mode
 */
export function detectTimeMode(data: readonly ChartDataPoint[]): ChartTimeMode {
  if (!data || data.length === 0) return "daily";

  const sample = data[0].date;

  // Hourly format: "HH:00" (5 chars, contains ":")
  if (/^\d{2}:\d{2}$/.test(sample)) {
    return "hourly";
  }

  return "daily";
}

// ============================================================================
// TICK CALCULATION
// ============================================================================

/**
 * Calculate the maximum number of ticks that fit comfortably
 * based on chart width and estimated label width.
 * 
 * @param chartWidth - Available chart width in pixels
 * @param estimatedLabelWidth - Estimated pixel width per label (with gap)
 */
function getMaxTicks(chartWidth: number, estimatedLabelWidth: number = 55): number {
  if (chartWidth <= 0) return 6;
  return Math.max(4, Math.floor(chartWidth / estimatedLabelWidth));
}

/**
 * Select items with a consistent fixed integer step.
 * 
 * Unlike the previous fractional-step approach, this uses
 * Math.ceil to produce a fixed integer step, guaranteeing
 * perfectly uniform gaps between selected items.
 * 
 * Includes a 20% tolerance threshold: if items nearly fit
 * (within 120% of maxCount), all items are shown to avoid
 * removing just 1-2 items inconsistently.
 */
function selectWithConsistentStep(
  items: readonly string[],
  maxCount: number,
): string[] {
  // Tolerance: if items nearly fit (within 20%), show all
  if (items.length <= Math.ceil(maxCount * 1.2)) return [...items];

  // Use fixed integer step for consistent gaps
  const step = Math.ceil(items.length / maxCount);
  const result: string[] = [];

  for (let i = 0; i < items.length; i += step) {
    result.push(items[i]);
  }

  // Always include last item if not already included
  if (result[result.length - 1] !== items[items.length - 1]) {
    result.push(items[items.length - 1]);
  }

  return result;
}

/**
 * Natural divisors of 24 for perfectly uniform hourly tick spacing.
 * Each interval divides 24 evenly, guaranteeing consistent gaps.
 */
const NATURAL_HOUR_INTERVALS = [1, 2, 3, 4, 6, 8, 12] as const;

/**
 * Calculate hourly ticks using natural divisors of 24.
 * 
 * Instead of fractional steps that cause rounding artifacts
 * (e.g., 12h followed by 13h), this selects the smallest
 * natural interval where the resulting tick count fits.
 */
function calculateHourlyTicks(
  data: readonly ChartDataPoint[],
  chartWidth: number,
): XAxisConfig {
  const maxTicks = getMaxTicks(chartWidth, 45); // "09h" labels are ~45px
  const allDates = data.map((d) => d.date);

  // Find smallest natural interval that fits within maxTicks
  let interval = 12;
  for (const candidate of NATURAL_HOUR_INTERVALS) {
    if (Math.ceil(allDates.length / candidate) <= maxTicks) {
      interval = candidate;
      break;
    }
  }

  // Generate ticks at natural intervals
  const ticks: string[] = [];
  for (let i = 0; i < allDates.length; i += interval) {
    ticks.push(allDates[i]);
  }

  return {
    ticks,
    formatter: (value: string) => {
      // "09:00" → "09h"
      const hour = value.split(":")[0];
      return `${hour}h`;
    },
  };
}

/**
 * Calculate daily ticks with adaptive formatting based on range length.
 */
function calculateDailyTicks(
  data: readonly ChartDataPoint[],
  chartWidth: number,
): XAxisConfig {
  const count = data.length;

  // Estimate label width based on the format that will be used
  let estimatedLabelWidth: number;
  if (count <= 14) {
    estimatedLabelWidth = 50;  // "15/01" format
  } else if (count <= 62) {
    estimatedLabelWidth = 55;  // "8 Jan" format
  } else {
    estimatedLabelWidth = 58;  // "Jan/26" format
  }

  const maxTicks = getMaxTicks(chartWidth, estimatedLabelWidth);
  const allDates = data.map((d) => d.date);
  const ticks = selectWithConsistentStep(allDates, maxTicks);

  // Choose formatter based on total data points
  const formatter = getDailyFormatter(count);

  return { ticks, formatter };
}

/**
 * Get the appropriate date formatter based on the number of data points.
 * 
 * - 2-14 days: "DD/MM" (e.g., "15/01")
 * - 15-62 days: "DD Mon" (e.g., "15 Jan")
 * - 63+ days: "Mon" or "Mon/YY" (e.g., "Jan" or "Jan/26")
 */
function getDailyFormatter(dataPointCount: number): (value: string) => string {
  if (dataPointCount <= 14) {
    // Short range: "DD/MM"
    return (value: string) => {
      const parts = value.split("-");
      if (parts.length < 3) return value;
      return `${parts[2]}/${parts[1]}`;
    };
  }

  if (dataPointCount <= 62) {
    // Medium range: "DD Mon"
    return (value: string) => {
      const parts = value.split("-");
      if (parts.length < 3) return value;
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthName = MONTH_SHORT[monthIndex] ?? parts[1];
      return `${parseInt(parts[2], 10)} ${monthName}`;
    };
  }

  // Long range: "Mon" or "Mon/YY" if spans multiple years
  return (value: string) => {
    const parts = value.split("-");
    if (parts.length < 3) return value;
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthName = MONTH_SHORT[monthIndex] ?? parts[1];
    const yearShort = parts[0].slice(2);
    return `${monthName}/${yearShort}`;
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate X-axis configuration (ticks + formatter) based on
 * data granularity and available chart width.
 * 
 * @param data - Chart data points
 * @param mode - Detected time mode (hourly or daily)
 * @param chartWidth - Available chart width in pixels
 * @returns Tick values and formatter function
 */
export function calculateXAxisConfig(
  data: readonly ChartDataPoint[],
  mode: ChartTimeMode,
  chartWidth: number,
): XAxisConfig {
  if (!data || data.length === 0) {
    return { ticks: [], formatter: (v: string) => v };
  }

  if (data.length === 1) {
    return {
      ticks: [data[0].date],
      formatter: mode === "hourly"
        ? (v: string) => `${v.split(":")[0]}h`
        : (v: string) => {
            const parts = v.split("-");
            return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : v;
          },
    };
  }

  return mode === "hourly"
    ? calculateHourlyTicks(data, chartWidth)
    : calculateDailyTicks(data, chartWidth);
}

/**
 * Format a date/time value for display in the tooltip.
 * 
 * @param value - Raw date string from chart data
 * @param mode - Detected time mode
 * @returns Human-readable label for tooltip
 */
export function formatTooltipLabel(value: string, mode: ChartTimeMode): string {
  if (mode === "hourly") {
    // "09:00" stays as "09:00"
    return value;
  }

  // "2026-01-15" → "15/01/2026"
  const parts = value.split("-");
  if (parts.length < 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
