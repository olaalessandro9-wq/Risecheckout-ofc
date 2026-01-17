/**
 * Tipos centralizados para o Dashboard Module
 * 
 * @module dashboard/types
 * @version RISE V3 Compliant
 * 
 * Este arquivo contém TODAS as tipagens do módulo Dashboard,
 * servindo como Single Source of Truth para tipos.
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// DATE RANGE TYPES
// ============================================================================

/**
 * Presets disponíveis para filtro de data
 */
export type DateRangePreset = 
  | "today" 
  | "yesterday" 
  | "7days" 
  | "30days" 
  | "max" 
  | "custom";

/**
 * Estado do reducer de DateRange
 */
export interface DateRangeState {
  readonly preset: DateRangePreset;
  readonly dropdownOpen: boolean;
  readonly calendarOpen: boolean;
  readonly leftDate: Date | undefined;
  readonly rightDate: Date | undefined;
  readonly leftMonth: Date;
  readonly rightMonth: Date;
  readonly savedRange: { from: Date; to: Date } | undefined;
  readonly hasError: boolean;
}

/**
 * Ações do reducer de DateRange (Discriminated Union)
 */
export type DateRangeAction =
  | { type: "SET_PRESET"; payload: DateRangePreset }
  | { type: "OPEN_DROPDOWN" }
  | { type: "CLOSE_DROPDOWN" }
  | { type: "OPEN_CALENDAR" }
  | { type: "CLOSE_CALENDAR" }
  | { type: "SET_LEFT_DATE"; payload: Date | undefined }
  | { type: "SET_RIGHT_DATE"; payload: Date | undefined }
  | { type: "SET_LEFT_MONTH"; payload: Date }
  | { type: "SET_RIGHT_MONTH"; payload: Date }
  | { type: "APPLY_CUSTOM_RANGE" }
  | { type: "CANCEL" }
  | { type: "RESTORE_SAVED" };

/**
 * Interface para intervalo de datas calculado
 */
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

// ============================================================================
// METRICS TYPES
// ============================================================================

/**
 * Dados de tendência (trend) para métricas
 */
export interface TrendData {
  readonly value: number;
  readonly isPositive: boolean;
  readonly label: string;
}

/**
 * Métricas calculadas do dashboard
 */
export interface DashboardMetrics {
  // Métricas financeiras
  readonly totalRevenue: string;
  readonly paidRevenue: string;
  readonly pendingRevenue: string;
  readonly totalFees: string;
  
  // Métricas de conversão
  readonly checkoutsStarted: number;
  readonly totalPaidOrders: number;
  readonly totalPendingOrders: number;
  readonly conversionRate: string;
  
  // Métricas adicionais
  readonly averageTicket: string;
  readonly pixRevenue: string;
  readonly creditCardRevenue: string;
  
  // Trends (opcionais)
  readonly revenueTrend?: TrendData;
  readonly conversionTrend?: TrendData;
}

// ============================================================================
// CHART TYPES
// ============================================================================

/**
 * Ponto de dados para gráficos
 */
export interface ChartDataPoint {
  date: string;
  revenue: number;
  fees: number;
  emails: number;
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

/**
 * Status de exibição para clientes
 * 
 * MODELO HOTMART/KIWIFY (padrão de mercado):
 * - Apenas 4 status possíveis
 * - Vendas pendentes NUNCA viram "canceladas"
 * - Expired/Failed/Cancelled = Pendente na UI
 */
export type CustomerDisplayStatus = 
  | "Pago" 
  | "Pendente" 
  | "Reembolso" 
  | "Chargeback";

/**
 * Cliente recente formatado para exibição
 */
export interface RecentCustomer {
  readonly id: string;
  readonly orderId: string;
  readonly offer: string;
  readonly client: string;
  readonly phone: string;
  readonly email: string;
  readonly createdAt: string;
  readonly value: string;
  /** Status traduzido para exibição */
  readonly status: CustomerDisplayStatus;
  /** Status raw original (para debugging/diagnóstico) */
  readonly statusRaw?: string;
  // Dados completos para o dialog
  readonly productName: string;
  readonly productImageUrl: string;
  readonly productOwnerId: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly customerDocument: string;
  readonly fullCreatedAt: string;
}

// ============================================================================
// ORDER TYPES (API Response)
// ============================================================================

/**
 * Produto dentro de um pedido
 */
export interface OrderProduct {
  readonly id: string;
  readonly name: string;
  readonly image_url: string | null;
  readonly user_id: string;
}

/**
 * Pedido retornado pela API
 */
export interface Order {
  readonly id: string;
  readonly customer_name: string | null;
  readonly customer_email: string | null;
  readonly customer_phone: string | null;
  readonly customer_document: string | null;
  readonly amount_cents: number;
  readonly status: string;
  readonly payment_method: string | null;
  readonly created_at: string;
  readonly product: OrderProduct | OrderProduct[] | null;
}

// ============================================================================
// RPC TYPES (Database Response)
// ============================================================================

/**
 * Retorno da função RPC `get_dashboard_metrics`
 */
export interface RpcDashboardMetrics {
  readonly paid_count: number;
  readonly pending_count: number;
  readonly total_count: number;
  readonly paid_revenue_cents: number;
  readonly pending_revenue_cents: number;
  readonly total_revenue_cents: number;
  readonly pix_revenue_cents: number;
  readonly credit_card_revenue_cents: number;
  readonly fees_cents: number;
}

// ============================================================================
// DASHBOARD DATA (Final Output)
// ============================================================================

/**
 * Dados consolidados retornados pelo hook useDashboard
 */
export interface DashboardData {
  readonly metrics: DashboardMetrics;
  readonly chartData: ChartDataPoint[];
  readonly recentCustomers: RecentCustomer[];
}

// ============================================================================
// CONFIG TYPES (Declarative)
// ============================================================================

/**
 * Esquema de cores disponíveis para métricas
 */
export type MetricColorScheme = 
  | "emerald" 
  | "blue" 
  | "amber" 
  | "purple" 
  | "teal";

/**
 * Configuração declarativa de uma métrica
 */
export interface MetricConfig {
  readonly id: string;
  readonly title: string;
  readonly metricKey: keyof DashboardMetrics;
  readonly trendKey?: keyof DashboardMetrics;
  readonly icon: LucideIcon;
  readonly colorScheme: MetricColorScheme;
  readonly delay: number;
}

/**
 * Configuração de cor para métricas
 */
export interface MetricColorConfig {
  readonly gradient: string;
  readonly iconBg: string;
  readonly iconText: string;
  readonly hoverBorder: string;
}

/**
 * Configuração declarativa de item do Overview Panel
 */
export interface OverviewItemConfig {
  readonly id: string;
  readonly title: string;
  readonly metricKey: keyof DashboardMetrics;
  readonly icon: LucideIcon;
  readonly colorScheme: MetricColorScheme;
  readonly delay: number;
}

/**
 * Configuração de preset de data
 */
export interface DatePresetConfig {
  readonly value: DateRangePreset;
  readonly label: string;
}
