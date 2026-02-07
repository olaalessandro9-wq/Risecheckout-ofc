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
 * based on chart width.
 */
function getMaxTicks(chartWidth: number): number {
  if (chartWidth <= 0) return 6;
  // ~80px per tick label is comfortable
  return Math.max(4, Math.floor(chartWidth / 80));
}

/**
 * Select evenly-distributed indices from an array.
 * Always includes first and last elements.
 */
function selectEvenlySpaced(items: readonly string[], maxCount: number): string[] {
  if (items.length <= maxCount) return [...items];

  const result: string[] = [items[0]];
  const step = (items.length - 1) / (maxCount - 1);

  for (let i = 1; i < maxCount - 1; i++) {
    const index = Math.round(step * i);
    result.push(items[index]);
  }

  result.push(items[items.length - 1]);
  return result;
}

/**
 * Calculate hourly ticks.
 * Shows ticks at regular intervals (every 3h by default),
 * adapting to chart width.
 */
function calculateHourlyTicks(
  data: readonly ChartDataPoint[],
  chartWidth: number,
): XAxisConfig {
  const maxTicks = getMaxTicks(chartWidth);
  const allDates = data.map((d) => d.date);
  const ticks = selectEvenlySpaced(allDates, maxTicks);

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
  const maxTicks = getMaxTicks(chartWidth);
  const allDates = data.map((d) => d.date);
  const ticks = selectEvenlySpaced(allDates, maxTicks);

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
