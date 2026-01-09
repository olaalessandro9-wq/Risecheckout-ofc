/**
 * Tipos e interfaces para o Dashboard Analytics
 * 
 * Arquivo centralizado para todas as tipagens do dashboard,
 * garantindo consistência e reutilização.
 */

// ============================================================================
// DATE RANGE
// ============================================================================

export type DateRangePreset = "today" | "yesterday" | "7days" | "30days" | "max" | "custom";

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface TrendData {
  value: number;
  isPositive: boolean;
  label: string;
}

export interface DashboardMetrics {
  // Métricas financeiras
  totalRevenue: string;
  paidRevenue: string;
  pendingRevenue: string;
  totalFees: string;
  
  // Métricas de conversão
  checkoutsStarted: number;
  totalPaidOrders: number;
  totalPendingOrders: number;
  conversionRate: string;
  
  // Métricas adicionais
  averageTicket: string;
  pixRevenue: string;
  creditCardRevenue: string;
  
  // Trends
  revenueTrend?: TrendData;
  conversionTrend?: TrendData;
}

// ============================================================================
// CHART TYPES
// ============================================================================

export interface ChartDataPoint {
  date: string;
  revenue: number;
  fees: number;
  emails: number;
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface RecentCustomer {
  id: string;
  orderId: string;
  offer: string;
  client: string;
  phone: string;
  email: string;
  createdAt: string;
  value: string;
  status: "Pago" | "Pendente" | "Reembolso" | "Chargeback";
  // Dados completos para o dialog
  productName: string;
  productImageUrl: string;
  productOwnerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  fullCreatedAt: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface Order {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  product: OrderProduct | OrderProduct[] | null;
}

export interface OrderProduct {
  id: string;
  name: string;
  image_url: string | null;
  user_id: string;
}

// ============================================================================
// RPC TYPES (Retorno do banco de dados)
// ============================================================================

/**
 * Interface estrita para retorno da função RPC `get_dashboard_metrics`
 * 
 * Esta tipagem garante que os dados vindos do banco sejam tratados
 * corretamente, evitando erros de runtime por dados nulos ou undefined.
 */
export interface RpcDashboardMetrics {
  paid_count: number;
  pending_count: number;
  total_count: number;
  paid_revenue_cents: number;
  pending_revenue_cents: number;
  total_revenue_cents: number;
  pix_revenue_cents: number;
  credit_card_revenue_cents: number;
  fees_cents: number;
}

// ============================================================================
// DASHBOARD DATA (Retorno final do hook)
// ============================================================================

export interface DashboardData {
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  recentCustomers: RecentCustomer[];
}
