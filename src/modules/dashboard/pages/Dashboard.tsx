/**
 * Dashboard Page
 * 
 * @module dashboard
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Página principal do Dashboard - ~70 linhas.
 * Zero useState - usa useDashboard como SSOT.
 * ZERO framer-motion - CSS puro para máxima performance.
 * Otimizado para ultrawide com CSS containment.
 */

import { useDashboard } from "../hooks";
import {
  DashboardHeader,
  MetricsGrid,
  OverviewPanel,
  RevenueChart,
} from "../components";
import { RecentCustomersTable } from "@/components/dashboard/recent-customers";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { state, actions, data, isLoading, refetch } = useDashboard();
  const { disableAllAnimations } = useUltrawidePerformance();

  return (
    <div
      className={cn(
        "space-y-4 md:space-y-6 lg:space-y-8",
        !disableAllAnimations && "animate-in fade-in duration-300"
      )}
      style={{ contain: "layout style" }}
    >
      {/* Header com título e filtro de data */}
      <DashboardHeader state={state} actions={actions} />

      <div className="space-y-4 md:space-y-6">
        {/* Grid de métricas principais */}
        <MetricsGrid metrics={data?.metrics} isLoading={isLoading} />

        {/* Gráfico + Overview Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Container do gráfico com CSS Containment para isolar repaints */}
          <div
            className="xl:col-span-2 min-h-[350px] md:min-h-[400px] lg:min-h-[450px]"
            style={{
              contain: "layout style paint",
              isolation: "isolate",
            }}
          >
            <RevenueChart
              title="Fluxo de Faturamento"
              data={
                data?.chartData.map((d) => ({ date: d.date, value: d.revenue })) ||
                []
              }
              isLoading={isLoading}
            />
          </div>
          <OverviewPanel metrics={data?.metrics} isLoading={isLoading} />
        </div>
      </div>

      {/* Tabela de clientes recentes */}
      <div className="pt-4 md:pt-6 lg:pt-8">
        <RecentCustomersTable
          customers={data?.recentCustomers || []}
          isLoading={isLoading}
          onRefresh={() => refetch()}
        />
      </div>
    </div>
  );
}
