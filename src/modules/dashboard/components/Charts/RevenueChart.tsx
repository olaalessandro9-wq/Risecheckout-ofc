/**
 * RevenueChart Component (Migrado)
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Gráfico de faturamento com Recharts.
 */

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface RevenueChartProps {
  readonly title: string;
  readonly data: Array<{ date: string; value: number }>;
  readonly isLoading?: boolean;
}

type CustomTooltipProps = TooltipProps<number, string>;

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
            style={{ backgroundColor: "hsl(var(--success))" }}
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

/**
 * Calcula domínio e ticks do eixo Y
 */
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

export function RevenueChart({
  title,
  data,
  isLoading = false,
}: RevenueChartProps) {
  const yAxisConfig = useMemo(() => calculateYAxisConfig(data), [data]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full will-change-transform"
    >
      <div className="relative h-full bg-card border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-border transition-colors duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-base md:text-lg font-bold text-card-foreground tracking-tight flex items-center gap-2 md:gap-3">
            <div
              className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg ring-1"
              style={{
                backgroundColor: "hsl(var(--success) / 0.1)",
                borderColor: "hsl(var(--success) / 0.2)",
              }}
            >
              <div
                className="h-3 md:h-4 w-0.5 md:w-1 rounded-full"
                style={{ backgroundColor: "hsl(var(--success))" }}
              />
            </div>
            {title}
          </h3>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-[200px] md:min-h-[250px] lg:min-h-[300px]">
          {isLoading ? (
            <div className="space-y-4 h-full flex flex-col justify-center">
              <Skeleton className="h-[200px] w-full bg-muted/20" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
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
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "hsl(var(--success))",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    strokeOpacity: 0.3,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: "hsl(var(--success))",
                    fill: "hsl(var(--card))",
                  }}
                  activeDot={{
                    r: 8,
                    strokeWidth: 3,
                    stroke: "hsl(var(--success) / 0.3)",
                    fill: "hsl(var(--success))",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
