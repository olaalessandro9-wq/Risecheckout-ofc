import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfDay, endOfDay, subDays, format } from "date-fns";

export type DateRangePreset = "today" | "yesterday" | "7days" | "30days" | "max" | "custom";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TrendData {
  value: number;
  isPositive: boolean;
  label: string;
}

interface DashboardMetrics {
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
  
  // Novas métricas
  averageTicket: string;
  pixRevenue: string;
  creditCardRevenue: string;
  
  // Trends
  revenueTrend?: TrendData;
  conversionTrend?: TrendData;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  fees: number;
  emails: number;
}

interface RecentCustomer {
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

interface DashboardData {
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  recentCustomers: RecentCustomer[];
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  amount_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  product: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function translateStatus(status: string): "Pago" | "Pendente" | "Reembolso" | "Chargeback" {
  const statusMap: Record<string, "Pago" | "Pendente" | "Reembolso" | "Chargeback"> = {
    'paid': 'Pago',
    'pending': 'Pendente',
    'refunded': 'Reembolso',
    'chargeback': 'Chargeback'
  };
  return statusMap[status?.toLowerCase()] || 'Pendente';
}

/**
 * Calcula a variação percentual entre dois valores
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Calcula a taxa de gateway (3.99% + R$ 0,39 por transação)
 * TODO: Tornar isso configurável por gateway no futuro
 */
function calculateGatewayFee(amountCents: number): number {
  return Math.round(amountCents * 0.0399) + 39;
}

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

interface RpcMetricsResult {
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

/**
 * Busca métricas agregadas do banco via RPC (sem limite de 1000 registros)
 */
async function fetchAggregatedMetrics(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<RpcMetricsResult> {
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_vendor_id: vendorId,
    p_start_date: startOfDay(startDate).toISOString(),
    p_end_date: endOfDay(endDate).toISOString()
  });

  if (error) {
    console.error("[fetchAggregatedMetrics] Erro ao buscar métricas:", error);
    throw error;
  }

  // O RPC retorna JSON, então precisamos fazer cast seguro
  const result = data as unknown as RpcMetricsResult;
  return result;
}

/**
 * Busca pedidos recentes do Supabase (limitado a 50 para a tabela)
 */
async function fetchRecentOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      amount_cents,
      status,
      payment_method,
      created_at,
      product:product_id (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .eq("vendor_id", vendorId)
    .gte("created_at", startOfDay(startDate).toISOString())
    .lte("created_at", endOfDay(endDate).toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[fetchRecentOrders] Erro ao buscar pedidos:", error);
    throw error;
  }

  return orders || [];
}

/**
 * Busca dados para o gráfico (apenas pagos, agregados por dia)
 */
async function fetchChartOrders(
  vendorId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      amount_cents,
      status,
      payment_method,
      created_at,
      product:product_id (
        id,
        name,
        image_url,
        user_id
      )
    `)
    .eq("vendor_id", vendorId)
    .eq("status", "paid")
    .gte("created_at", startOfDay(startDate).toISOString())
    .lte("created_at", endOfDay(endDate).toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchChartOrders] Erro ao buscar pedidos para gráfico:", error);
    throw error;
  }

  return orders || [];
}

// ============================================================================
// METRICS CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calcula todas as métricas do dashboard
 */
function calculateMetrics(
  currentOrders: Order[],
  previousOrders: Order[]
): DashboardMetrics {
  // Filtrar pedidos por status
  const paidOrders = currentOrders.filter(o => o.status?.toLowerCase() === "paid");
  const pendingOrders = currentOrders.filter(o => o.status?.toLowerCase() === "pending");
  
  const previousPaidOrders = previousOrders.filter(o => o.status?.toLowerCase() === "paid");

  // Calcular receitas - FATURAMENTO = Vendas Aprovadas + Vendas Pendentes
  const paidRevenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);
  const totalRevenue = paidRevenue + pendingRevenue; // Faturamento total
  const previousRevenue = previousPaidOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  // Calcular taxas
  const totalFees = paidOrders.reduce((sum, o) => {
    return sum + calculateGatewayFee(o.amount_cents || 0);
  }, 0);

  // Calcular ticket médio (baseado apenas em vendas pagas)
  const averageTicketCents = paidOrders.length > 0
    ? Math.round(paidRevenue / paidOrders.length)
    : 0;

  // Calcular vendas por método de pagamento
  const pixOrders = paidOrders.filter(o => 
    o.payment_method?.toLowerCase() === 'pix'
  );
  const pixRevenue = pixOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  const creditCardOrders = paidOrders.filter(o => 
    o.payment_method?.toLowerCase() === 'credit_card'
  );
  const creditCardRevenue = creditCardOrders.reduce((sum, o) => sum + (o.amount_cents || 0), 0);

  // Calcular taxa de conversão
  const conversionRate = currentOrders.length > 0
    ? (paidOrders.length / currentOrders.length) * 100
    : 0;
  
  const previousConversionRate = previousOrders.length > 0
    ? (previousPaidOrders.length / previousOrders.length) * 100
    : 0;

  // Calcular trends (baseado em vendas pagas apenas para comparação justa)
  const revenueTrendValue = calculatePercentageChange(paidRevenue, previousRevenue);
  const conversionTrendValue = calculatePercentageChange(conversionRate, previousConversionRate);

  return {
    // Métricas financeiras
    totalRevenue: formatCurrency(totalRevenue),   // Faturamento = Aprovadas + Pendentes
    paidRevenue: formatCurrency(paidRevenue),     // Apenas Vendas Aprovadas
    pendingRevenue: formatCurrency(pendingRevenue),
    totalFees: formatCurrency(totalFees),
    
    // Métricas de conversão
    checkoutsStarted: currentOrders.length,
    totalPaidOrders: paidOrders.length,
    totalPendingOrders: pendingOrders.length,
    conversionRate: `${conversionRate.toFixed(2)}%`,
    
    // Novas métricas
    averageTicket: formatCurrency(averageTicketCents),
    pixRevenue: formatCurrency(pixRevenue),
    creditCardRevenue: formatCurrency(creditCardRevenue),
    
    // Trends
    revenueTrend: {
      value: Math.abs(revenueTrendValue),
      isPositive: revenueTrendValue >= 0,
      label: "vs. período anterior"
    },
    conversionTrend: {
      value: Math.abs(conversionTrendValue),
      isPositive: conversionTrendValue >= 0,
      label: "vs. período anterior"
    }
  };
}

/**
 * Calcula métricas do dashboard usando dados agregados do RPC
 * Esta função NÃO tem limite de 1000 registros porque usa agregação no banco
 */
function calculateMetricsFromRpc(
  current: RpcMetricsResult,
  previous: RpcMetricsResult
): DashboardMetrics {
  // Extrair valores do período atual
  const paidRevenue = current.paid_revenue_cents || 0;
  const pendingRevenue = current.pending_revenue_cents || 0;
  const totalRevenue = current.total_revenue_cents || 0;
  const paidCount = current.paid_count || 0;
  const pendingCount = current.pending_count || 0;
  const totalCount = current.total_count || 0;
  const totalFees = current.fees_cents || 0;
  const pixRevenue = current.pix_revenue_cents || 0;
  const creditCardRevenue = current.credit_card_revenue_cents || 0;

  // Extrair valores do período anterior
  const previousPaidRevenue = previous.paid_revenue_cents || 0;
  const previousPaidCount = previous.paid_count || 0;
  const previousTotalCount = previous.total_count || 0;

  // Calcular ticket médio (baseado apenas em vendas pagas)
  const averageTicketCents = paidCount > 0
    ? Math.round(paidRevenue / paidCount)
    : 0;

  // Calcular taxa de conversão
  const conversionRate = totalCount > 0
    ? (paidCount / totalCount) * 100
    : 0;
  
  const previousConversionRate = previousTotalCount > 0
    ? (previousPaidCount / previousTotalCount) * 100
    : 0;

  // Calcular trends (baseado em vendas pagas apenas para comparação justa)
  const revenueTrendValue = calculatePercentageChange(paidRevenue, previousPaidRevenue);
  const conversionTrendValue = calculatePercentageChange(conversionRate, previousConversionRate);

  return {
    // Métricas financeiras
    totalRevenue: formatCurrency(totalRevenue),   // Faturamento = Aprovadas + Pendentes
    paidRevenue: formatCurrency(paidRevenue),     // Apenas Vendas Aprovadas
    pendingRevenue: formatCurrency(pendingRevenue),
    totalFees: formatCurrency(totalFees),
    
    // Métricas de conversão
    checkoutsStarted: totalCount,
    totalPaidOrders: paidCount,
    totalPendingOrders: pendingCount,
    conversionRate: `${conversionRate.toFixed(2)}%`,
    
    // Novas métricas
    averageTicket: formatCurrency(averageTicketCents),
    pixRevenue: formatCurrency(pixRevenue),
    creditCardRevenue: formatCurrency(creditCardRevenue),
    
    // Trends
    revenueTrend: {
      value: Math.abs(revenueTrendValue),
      isPositive: revenueTrendValue >= 0,
      label: "vs. período anterior"
    },
    conversionTrend: {
      value: Math.abs(conversionTrendValue),
      isPositive: conversionTrendValue >= 0,
      label: "vs. período anterior"
    }
  };
}

/**
 * Agrupa dados por dia para os gráficos
 */
function calculateChartData(orders: Order[], startDate: Date, endDate: Date): ChartDataPoint[] {
  const chartDataMap = new Map<string, ChartDataPoint>();
  
  orders.forEach(order => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd');
    
    if (!chartDataMap.has(date)) {
      chartDataMap.set(date, {
        date,
        revenue: 0,
        fees: 0,
        emails: 0
      });
    }

    const dataPoint = chartDataMap.get(date)!;
    
    if (order.status?.toLowerCase() === "paid") {
      dataPoint.revenue += (order.amount_cents || 0) / 100;
      const fee = calculateGatewayFee(order.amount_cents || 0);
      dataPoint.fees += fee / 100;
    }
    
    if (order.customer_email) {
      dataPoint.emails += 1;
    }
  });

  let chartData = Array.from(chartDataMap.values());
  
  // Se não houver dados, criar pontos zerados para o período
  if (chartData.length === 0) {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const numPoints = Math.min(Math.max(daysDiff, 7), 30);
    
    for (let i = 0; i < numPoints; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(i * daysDiff / numPoints));
      chartData.push({
        date: format(date, 'yyyy-MM-dd'),
        revenue: 0,
        fees: 0,
        emails: 0
      });
    }
  }
  
  // Ordenar por data
  chartData.sort((a, b) => a.date.localeCompare(b.date));
  
  return chartData;
}

/**
 * Formata dados de clientes recentes
 */
function formatRecentCustomers(orders: Order[]): RecentCustomer[] {
  // Função para aplicar máscara no CPF/CNPJ
  const formatDocument = (doc: string | null): string => {
    if (!doc) return "N/A";
    const digits = doc.replace(/\D/g, '');
    if (digits.length === 11) {
      // CPF: 000.000.000-00
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (digits.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  return orders.map(order => {
    const product = Array.isArray(order.product) ? order.product[0] : order.product;
    
    return {
      id: order.id.substring(0, 8),
      orderId: order.id,
      offer: product?.name || "Produto não encontrado",
      client: order.customer_name || "N/A",
      phone: order.customer_phone || "N/A",
      email: order.customer_email || "N/A",
      createdAt: formatDate(order.created_at),
      value: formatCurrency(order.amount_cents || 0),
      status: translateStatus(order.status),
      productName: product?.name || "Produto não encontrado",
      productImageUrl: product?.image_url || "",
      productOwnerId: product?.user_id || "",
      customerName: order.customer_name || "N/A",
      customerEmail: order.customer_email || "N/A",
      customerPhone: order.customer_phone || "N/A",
      customerDocument: formatDocument(order.customer_document),
      fullCreatedAt: order.created_at
    };
  });
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useDashboardAnalytics(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ["dashboard-analytics", startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<DashboardData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const vendorId = session.user.id;

      // Calcular período anterior (mesmo tamanho do período atual)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
      const previousEndDate = new Date(startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      // Buscar métricas agregadas via RPC (sem limite de 1000!) + pedidos para gráfico e tabela
      const [currentMetrics, previousMetrics, chartOrders, recentOrders] = await Promise.all([
        fetchAggregatedMetrics(vendorId, startDate, endDate),
        fetchAggregatedMetrics(vendorId, previousStartDate, previousEndDate),
        fetchChartOrders(vendorId, startDate, endDate),
        fetchRecentOrders(vendorId, startDate, endDate)
      ]);

      console.log("[useDashboardAnalytics] Métricas período atual:", currentMetrics);
      console.log("[useDashboardAnalytics] Métricas período anterior:", previousMetrics);

      // Calcular métricas usando dados agregados do banco (CORRETO - sem limite de 1000)
      const metrics = calculateMetricsFromRpc(currentMetrics, previousMetrics);

      // Calcular dados dos gráficos
      const chartData = calculateChartData(chartOrders, startDate, endDate);

      // Formatar clientes recentes
      const recentCustomers = formatRecentCustomers(recentOrders);

      return {
        metrics,
        chartData,
        recentCustomers
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================================================
// DATE PRESET HELPER
// ============================================================================

export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  switch (preset) {
    case "today":
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    
    case "7days":
      return { startDate: startOfDay(subDays(now, 7)), endDate: endOfDay(now) };
    
    case "30days":
      return { startDate: startOfDay(subDays(now, 30)), endDate: endOfDay(now) };
    
    case "max":
      return { startDate: new Date("2020-01-01"), endDate: endOfDay(now) };
    
    default:
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
  }
}
