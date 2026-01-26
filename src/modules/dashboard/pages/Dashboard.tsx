/**
 * Dashboard Page
 * 
 * @module dashboard
 * @version RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Página principal do Dashboard - ~80 linhas.
 * Zero useState - usa useDashboard como SSOT.
 * Otimizado para ultrawide com UltrawidePerformanceContext.
 */

import { motion } from "framer-motion";
import { useDashboard } from "../hooks";
import {
  DashboardHeader,
  MetricsGrid,
  OverviewPanel,
  RevenueChart,
} from "../components";
import { RecentCustomersTable } from "@/components/dashboard/recent-customers";
import { useUltrawidePerformance } from "@/contexts/UltrawidePerformanceContext";

const PAGE_ANIMATION = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Dashboard() {
  const { state, actions, data, isLoading, refetch } = useDashboard();
  const { isUltrawide, disableAnimations } = useUltrawidePerformance();

  // Wrapper condicional: div simples em ultrawide (sem staggerChildren)
  const Wrapper = disableAnimations ? "div" : motion.div;
  const wrapperProps = disableAnimations
    ? {}
    : {
        initial: "hidden",
        animate: "show",
        variants: PAGE_ANIMATION,
      };

  return (
    <Wrapper
      {...wrapperProps}
      className="space-y-4 md:space-y-6 lg:space-y-8"
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
    </Wrapper>
  );
}
