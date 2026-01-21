/**
 * AdminFinanceTab - Aba de métricas financeiras do dashboard admin
 */

import { MetricCard, RevenueChart } from "@/modules/dashboard";
import { AdminTopSellersTable } from "./AdminTopSellersTable";
import { 
  useAdminFinancialMetrics, 
  useAdminDailyRevenue, 
  PeriodFilter 
} from "@/hooks/useAdminAnalytics";
import { formatCentsToBRL, toReais } from "@/lib/money";
import { DollarSign, TrendingUp, ShoppingCart, Users } from "lucide-react";

interface AdminFinanceTabProps {
  period: PeriodFilter;
}

export function AdminFinanceTab({ period }: AdminFinanceTabProps) {
  const { data: metrics, isLoading: metricsLoading } = useAdminFinancialMetrics(period);
  const { data: dailyRevenue, isLoading: chartLoading } = useAdminDailyRevenue(period);

  // Converter centavos para reais (PRICE_STANDARD.md: centavos no código, reais na tela)
  const platformFeeData = dailyRevenue?.map((d) => ({
    date: d.date,
    value: toReais(d.platformFee),
  })) || [];

  const gmvData = dailyRevenue?.map((d) => ({
    date: d.date,
    value: toReais(d.gmv),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Plataforma"
          value={formatCentsToBRL(metrics?.totalPlatformFees || 0)}
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
        <MetricCard
          title="GMV Total"
          value={formatCentsToBRL(metrics?.totalGMV || 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.1}
          iconClassName="bg-blue-500/10 text-blue-500"
        />
        <MetricCard
          title="Transações"
          value={metrics?.totalPaidOrders || 0}
          icon={<ShoppingCart className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.2}
          iconClassName="bg-purple-500/10 text-purple-500"
        />
        <MetricCard
          title="Sellers Ativos"
          value={metrics?.activeSellers || 0}
          icon={<Users className="h-4 w-4" />}
          isLoading={metricsLoading}
          showEye={false}
          delay={0.3}
          iconClassName="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart
          title="Receita da Plataforma"
          data={platformFeeData}
          isLoading={chartLoading}
        />
        <RevenueChart
          title="GMV (Volume de Vendas)"
          data={gmvData}
          isLoading={chartLoading}
        />
      </div>

      {/* Top Sellers Table */}
      <AdminTopSellersTable period={period} />
    </div>
  );
}
