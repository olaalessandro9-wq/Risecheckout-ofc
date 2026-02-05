/**
 * RevenueChart Component (Otimizado RISE V3)
 * 
 * @module dashboard/components
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Gráfico de área otimizado para performance em monitores ultrawide.
 * - AreaChart com gradiente azul RISE
 * - Dots invisíveis por padrão (aparecem no hover)
 * - Zero framer-motion para máxima performance
 * - CSS Containment para isolar repaints
 * - useChartDimensions customizado (substitui ResponsiveContainer)
 */

import { useMemo, useId, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TooltipProps } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { useChartDimensions } from "@/hooks/useChartDimensions";

// ============================================================================
// CONSTANTS - Cores RISE (Azul Primário)
// ============================================================================

const CHART_COLOR = "#004fff";
const CHART_COLOR_RGB = "0, 79, 255";

// ============================================================================
// TYPES
// ============================================================================

interface RevenueChartProps {
  readonly title: string;
  readonly data: Array<{ date: string; value: number }>;
  readonly isLoading?: boolean;
}

type CustomTooltipProps = TooltipProps<number, string>;

// ============================================================================
// COMPONENTS
// ============================================================================

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xl font-bold text-card-foreground tracking-tight flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: CHART_COLOR }}
          />
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(payload[0].value ?? 0)}
        </p>
      </div>
    );
  }
  return null;
}

// ============================================================================
// UTILITIES - Sistema Inteligente de Ticks
// ============================================================================

function calculateYAxisConfig(data: Array<{ date: string; value: number }>): {
  domain: [number, number];
  ticks: number[];
} {
  if (!data || data.length === 0) {
    return { domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100] };
  }

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (maxValue === 0) {
    return { domain: [0, 100], ticks: [0, 20, 40, 60, 80, 100] };
  }

  const range = maxValue - minValue;
  const marginPercentage = range < maxValue * 0.05 ? 0.15 : 0.1;
  const margin = maxValue * marginPercentage;

  let yMin: number;
  if (minValue < maxValue * 0.2) {
    yMin = 0;
  } else {
    yMin = Math.max(0, minValue - margin);
  }

  const yMaxWithMargin = maxValue + margin;

  const roundUpToNice = (value: number): number => {
    if (value === 0) return 0;

    let increment: number;
    if (value <= 100) increment = 10;
    else if (value <= 500) increment = 50;
    else if (value <= 1000) increment = 100;
    else if (value <= 2500) increment = 250;
    else if (value <= 5000) increment = 500;
    else if (value <= 10000) increment = 1000;
    else if (value <= 25000) increment = 2500;
    else if (value <= 50000) increment = 5000;
    else increment = 10000;

    return Math.ceil(value / increment) * increment;
  };

  const yMinRounded = yMin === 0 ? 0 : Math.floor(yMin / 100) * 100;
  const yMaxRounded = roundUpToNice(yMaxWithMargin);

  const ticks: number[] = [];
  const step = (yMaxRounded - yMinRounded) / 5;
  for (let i = 0; i <= 5; i++) {
    ticks.push(Math.round(yMinRounded + step * i));
  }

  return { domain: [yMinRounded, yMaxRounded], ticks };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RevenueChart({
  title,
  data,
  isLoading = false,
}: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isUltrawide, chartConfig } = useUltrawidePerformance();
  const gradientId = useId();
  const yAxisConfig = useMemo(() => calculateYAxisConfig(data), [data]);
  
  // Hook customizado com delay reduzido (FLIP elimina layout thrash)
  // 100ms é suficiente agora que não há mais reflow por frame
  const { width, height } = useChartDimensions(containerRef, 100);

  // Renderizar gráfico apenas quando dimensões válidas
  const showChart = width > 0 && height > 0 && !isLoading;

  // Cursor style para tooltip
  const cursorStyle = useMemo(() => ({
    stroke: CHART_COLOR,
    strokeWidth: 1,
    strokeOpacity: isUltrawide ? 0.2 : 0.3,
    strokeDasharray: isUltrawide ? undefined : "4 4",
  }), [isUltrawide]);

  return (
    <div
      className="relative h-full bg-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-border transition-colors duration-200 flex flex-col"
      style={{
        contain: "layout style paint",
        isolation: "isolate",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
        <h3 className="text-base md:text-lg font-bold text-card-foreground tracking-tight flex items-center gap-2 md:gap-3">
          <div
            className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg ring-1"
            style={{
              backgroundColor: `rgba(${CHART_COLOR_RGB}, 0.1)`,
              borderColor: `rgba(${CHART_COLOR_RGB}, 0.2)`,
            }}
          >
            <div
              className="h-3 md:h-4 w-0.5 md:w-1 rounded-full"
              style={{ backgroundColor: CHART_COLOR }}
            />
          </div>
          {title}
        </h3>
      </div>

      {/* Chart Container - ref para useChartDimensions */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[200px] md:min-h-[250px] lg:min-h-[300px]"
        style={{ contain: "layout style" }}
      >
        {isLoading ? (
          <div className="space-y-4 h-full flex flex-col justify-center">
            <Skeleton className="h-[200px] w-full bg-muted/20" />
          </div>
        ) : showChart ? (
          <AreaChart
            width={width}
            height={height}
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {/* Gradient Definition */}
            <defs>
              <linearGradient id={`area-gradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--chart-grid))"
              opacity={0.2}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="hsl(var(--chart-axis))"
              style={{ fontSize: "11px", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              dy={10}
              padding={{ left: 20, right: 20 }}
              interval={isUltrawide ? "preserveStartEnd" : "preserveEnd"}
              minTickGap={isUltrawide ? 100 : 50}
            />

            <YAxis
              stroke="hsl(var(--chart-axis))"
              style={{ fontSize: "11px", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
              width={55}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `R$ ${(value / 1000).toFixed(1)}k`;
                }
                return `R$ ${value}`;
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={cursorStyle} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART_COLOR}
              strokeWidth={chartConfig.strokeWidth}
              fill={`url(#area-gradient-${gradientId})`}
              isAnimationActive={chartConfig.isAnimationActive}
              animationDuration={chartConfig.animationDuration}
              dot={false}
              activeDot={{
                r: 6,
                fill: CHART_COLOR,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        ) : null}
      </div>
    </div>
  );
}
