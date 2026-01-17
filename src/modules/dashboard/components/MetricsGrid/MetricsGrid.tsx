/**
 * MetricsGrid Component
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Grid que renderiza as 4 métricas principais baseado em configuração declarativa.
 * Zero lógica de negócio - apenas renderização.
 */

import { MetricCard } from "./MetricCard";
import { DASHBOARD_METRICS_CONFIG, getMetricColorClasses } from "../../config";
import type { DashboardMetrics, TrendData } from "../../types";

interface MetricsGridProps {
  readonly metrics: DashboardMetrics | undefined;
  readonly isLoading: boolean;
}

export function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {DASHBOARD_METRICS_CONFIG.map((config) => {
        const colorClasses = getMetricColorClasses(config.colorScheme);
        const IconComponent = config.icon;
        
        // Obter valor da métrica
        const value = metrics?.[config.metricKey] ?? (
          config.metricKey.includes("Revenue") || 
          config.metricKey.includes("Ticket") 
            ? "R$ 0,00" 
            : "0"
        );
        
        // Obter trend se existir
        const trend = config.trendKey && metrics?.[config.trendKey]
          ? (metrics[config.trendKey] as TrendData)
          : undefined;

        return (
          <MetricCard
            key={config.id}
            title={config.title}
            value={value as string | number}
            isLoading={isLoading}
            icon={<IconComponent className="w-5 h-5" />}
            trend={trend}
            delay={config.delay}
            className={`${colorClasses.gradient} ${colorClasses.hoverBorder}`}
            iconClassName={`${colorClasses.iconBg} ${colorClasses.iconText}`}
          />
        );
      })}
    </div>
  );
}
