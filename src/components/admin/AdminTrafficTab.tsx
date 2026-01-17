/**
 * AdminTrafficTab - Aba de métricas de tráfego do dashboard admin
 */

import { MetricCard } from "@/modules/dashboard";

import { 
  useAdminTrafficMetrics, 
  useAdminDailyVisits,
  useAdminTopSources,
  PeriodFilter 
} from "@/hooks/useAdminAnalytics";
import { Eye, Users, LayoutGrid, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface AdminTrafficTabProps {
  period: PeriodFilter;
}

/**
 * Custom tooltip for chart display
 * Uses recharts TooltipProps with proper typing
 */
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{String(label)}</p>
        <p className="text-xl font-bold text-card-foreground tracking-tight flex items-center gap-1">
          <span className="w-2 h-2 rounded-full animate-pulse bg-primary" />
          {payload[0].value} visitas
        </p>
      </div>
    );
  }
  return null;
};

const SourceTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-xl">
        <p className="text-xs font-semibold text-muted-foreground mb-1">{String(label)}</p>
        <p className="text-xl font-bold text-card-foreground">{payload[0].value} visitas</p>
      </div>
    );
  }
  return null;
};

export function AdminTrafficTab({ period }: AdminTrafficTabProps) {
  const { data: metrics, isLoading: metricsLoading } = useAdminTrafficMetrics(period);
  const { data: dailyVisits, isLoading: visitsLoading } = useAdminDailyVisits(period);
  const { data: topSources, isLoading: sourcesLoading } = useAdminTopSources(period);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Visitas"
          value={metrics?.totalVisits || 0}
          icon={<Eye className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          title="Visitantes Únicos"
          value={metrics?.uniqueVisitors || 0}
          icon={<Users className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.1}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
        <MetricCard
          title="Checkouts Ativos"
          value={metrics?.activeCheckouts || 0}
          icon={<LayoutGrid className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.2}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics?.globalConversionRate || 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.3}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Visits Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl blur-2xl opacity-50" />
          <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:border-border transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-card-foreground tracking-tight flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 bg-primary/10 ring-primary/20">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                Visitas por Dia
              </h3>
            </div>
            <div className="h-[300px]">
              {visitsLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyVisits || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <filter id="glowVisits">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" opacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--chart-axis))"
                      style={{ fontSize: '11px', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="hsl(var(--chart-axis))"
                      style={{ fontSize: '11px', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      filter="url(#glowVisits)"
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        stroke: "hsl(var(--primary))",
                        fill: "hsl(var(--card))",
                      }}
                      activeDot={{
                        r: 8,
                        strokeWidth: 3,
                        stroke: "hsl(var(--primary) / 0.3)",
                        fill: "hsl(var(--primary))",
                        filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.8))"
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        {/* Top Sources Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-transparent rounded-2xl blur-2xl opacity-50" />
          <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:border-border transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-card-foreground tracking-tight flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 bg-accent/10 ring-accent/20">
                  <TrendingUp className="h-4 w-4 text-accent-foreground" />
                </div>
                Top Fontes de Tráfego
              </h3>
            </div>
            <div className="h-[300px]">
              {sourcesLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (topSources?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSources || []} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" opacity={0.2} horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--chart-axis))" style={{ fontSize: '11px' }} />
                    <YAxis 
                      dataKey="source" 
                      type="category" 
                      stroke="hsl(var(--chart-axis))" 
                      style={{ fontSize: '11px' }}
                      width={80}
                    />
                    <Tooltip content={<SourceTooltip />} />
                    <Bar 
                      dataKey="visits" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado de UTM disponível
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
