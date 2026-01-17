/**
 * Configuração Declarativa de Métricas
 * 
 * @module dashboard/config
 * @version RISE V3 Compliant
 * 
 * Define todas as métricas do dashboard de forma declarativa.
 * Para adicionar uma nova métrica, basta adicionar um objeto ao array.
 */

import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  TrendingUp 
} from "lucide-react";
import type { MetricConfig, MetricColorConfig, MetricColorScheme } from "../types/dashboard.types";

// ============================================================================
// COLOR CONFIGURATIONS
// ============================================================================

/**
 * Mapeamento de esquemas de cores para classes CSS
 */
export const METRIC_COLORS: Record<MetricColorScheme, MetricColorConfig> = {
  emerald: {
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/20",
  },
  blue: {
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    hoverBorder: "hover:border-blue-500/20",
  },
  amber: {
    gradient: "from-amber-500/10 to-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
    hoverBorder: "hover:border-amber-500/20",
  },
  purple: {
    gradient: "from-purple-500/10 to-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-500",
    hoverBorder: "hover:border-purple-500/20",
  },
  teal: {
    gradient: "from-teal-500/10 to-teal-500/5",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-500",
    hoverBorder: "hover:border-teal-500/20",
  },
} as const;

// ============================================================================
// METRICS CONFIGURATION
// ============================================================================

/**
 * Configuração das 4 métricas principais (KPI Row)
 * 
 * Para adicionar uma nova métrica:
 * 1. Adicione um objeto com id, title, metricKey, icon, colorScheme, delay
 * 2. Se tiver trend, adicione trendKey
 * 3. O MetricsGrid renderizará automaticamente
 */
export const DASHBOARD_METRICS_CONFIG: readonly MetricConfig[] = [
  {
    id: "revenue",
    title: "Faturamento",
    metricKey: "totalRevenue",
    trendKey: "revenueTrend",
    icon: DollarSign,
    colorScheme: "emerald",
    delay: 0.1,
  },
  {
    id: "paid",
    title: "Vendas aprovadas",
    metricKey: "paidRevenue",
    icon: CreditCard,
    colorScheme: "blue",
    delay: 0.2,
  },
  {
    id: "pending",
    title: "Vendas pendentes",
    metricKey: "pendingRevenue",
    icon: Clock,
    colorScheme: "amber",
    delay: 0.3,
  },
  {
    id: "conversion",
    title: "Taxa de Conversão",
    metricKey: "conversionRate",
    trendKey: "conversionTrend",
    icon: TrendingUp,
    colorScheme: "purple",
    delay: 0.4,
  },
] as const;

/**
 * Retorna as classes CSS para um esquema de cores
 */
export function getMetricColorClasses(colorScheme: MetricColorScheme): MetricColorConfig {
  return METRIC_COLORS[colorScheme];
}
