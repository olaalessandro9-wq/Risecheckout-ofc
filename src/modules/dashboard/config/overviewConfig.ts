/**
 * Configuração Declarativa do Overview Panel
 * 
 * @module dashboard/config
 * @version RISE V3 Compliant
 * 
 * Define os 5 itens do painel lateral de forma declarativa.
 */

import { 
  CheckCircle2, 
  AlertCircle, 
  Tags, 
  QrCode, 
  CreditCard 
} from "lucide-react";
import type { OverviewItemConfig, MetricColorScheme } from "../types/dashboard.types";

// ============================================================================
// OVERVIEW COLORS
// ============================================================================

/**
 * Mapeamento de cores para o Overview Panel
 */
export const OVERVIEW_COLORS: Record<MetricColorScheme, {
  gradient: string;
  glow: string;
  iconBg: string;
}> = {
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-600/20",
    glow: "group-hover:shadow-emerald-500/20",
    iconBg: "bg-emerald-500",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-600/20",
    glow: "group-hover:shadow-amber-500/20",
    iconBg: "bg-amber-500",
  },
  blue: {
    gradient: "from-blue-500/20 to-blue-600/20",
    glow: "group-hover:shadow-blue-500/20",
    iconBg: "bg-blue-500",
  },
  teal: {
    gradient: "from-teal-500/20 to-teal-600/20",
    glow: "group-hover:shadow-teal-500/20",
    iconBg: "bg-teal-500",
  },
  purple: {
    gradient: "from-purple-500/20 to-purple-600/20",
    glow: "group-hover:shadow-purple-500/20",
    iconBg: "bg-purple-500",
  },
} as const;

// ============================================================================
// OVERVIEW CONFIGURATION
// ============================================================================

/**
 * Configuração dos 5 itens do Overview Panel
 * 
 * Para adicionar um novo item:
 * 1. Adicione um objeto com id, title, metricKey, icon, colorScheme, delay
 * 2. O OverviewPanel renderizará automaticamente
 */
export const OVERVIEW_ITEMS_CONFIG: readonly OverviewItemConfig[] = [
  {
    id: "paid-orders",
    title: "Vendas Aprovadas",
    metricKey: "totalPaidOrders",
    icon: CheckCircle2,
    colorScheme: "emerald",
    delay: 0,
  },
  {
    id: "pending-orders",
    title: "Vendas Pendentes",
    metricKey: "totalPendingOrders",
    icon: AlertCircle,
    colorScheme: "amber",
    delay: 0.1,
  },
  {
    id: "avg-ticket",
    title: "Ticket Médio",
    metricKey: "averageTicket",
    icon: Tags,
    colorScheme: "blue",
    delay: 0.2,
  },
  {
    id: "pix-revenue",
    title: "Vendas por Pix",
    metricKey: "pixRevenue",
    icon: QrCode,
    colorScheme: "teal",
    delay: 0.3,
  },
  {
    id: "card-revenue",
    title: "Vendas por cartão",
    metricKey: "creditCardRevenue",
    icon: CreditCard,
    colorScheme: "purple",
    delay: 0.4,
  },
] as const;

/**
 * Retorna as classes CSS para um item do Overview
 */
export function getOverviewColorClasses(colorScheme: MetricColorScheme) {
  return OVERVIEW_COLORS[colorScheme];
}
