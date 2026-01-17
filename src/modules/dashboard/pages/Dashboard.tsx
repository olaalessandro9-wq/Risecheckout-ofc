/**
 * Dashboard Page
 * 
 * @module dashboard
 * @version RISE V3 Compliant
 * 
 * Página principal do Dashboard - ~80 linhas.
 * Zero useState - usa useDashboard como SSOT.
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

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={PAGE_ANIMATION}
      className="space-y-4 md:space-y-6 lg:space-y-8"
    >
      {/* Header com título e filtro de data */}
      <DashboardHeader state={state} actions={actions} />

      <div className="space-y-4 md:space-y-6">
        {/* Grid de métricas principais */}
        <MetricsGrid metrics={data?.metrics} isLoading={isLoading} />

        {/* Gráfico + Overview Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2 min-h-[350px] md:min-h-[400px] lg:min-h-[450px]">
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
    </motion.div>
  );
}
