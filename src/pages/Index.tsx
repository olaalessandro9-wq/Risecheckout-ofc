import { useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentCustomersTable } from "@/components/dashboard/recent-customers";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { useDashboardAnalytics, getDateRangeFromPreset, type DateRangePreset } from "@/hooks/dashboard";
import { DollarSign, CreditCard, Clock, CheckCircle2, AlertCircle, Activity, TrendingUp, QrCode, Tags } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>("30days");
  const initialDates = getDateRangeFromPreset("30days");
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date }>({
    start: initialDates.startDate,
    end: initialDates.endDate,
  });

  const dateRange = selectedPreset === "custom"
    ? { startDate: customDates.start, endDate: customDates.end }
    : getDateRangeFromPreset(selectedPreset);

  const { data, isLoading, refetch } = useDashboardAnalytics(dateRange.startDate, dateRange.endDate);

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
  };

  const handleCustomDateChange = (start: Date, end: Date) => {
    setCustomDates({ start, end });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-4 md:space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-1 md:mb-2">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            Visão geral do seu desempenho e métricas
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-1 md:p-1.5 rounded-xl border border-border w-full md:w-auto">
          <DateRangeFilter
            selectedPreset={selectedPreset}
            onPresetChange={handlePresetChange}
            customStartDate={customDates.start}
            customEndDate={customDates.end}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Top KPI Row - 4 Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard
            title="Faturamento"
            value={data?.metrics.totalRevenue || "R$ 0,00"}
            isLoading={isLoading}
            icon={<DollarSign className="w-5 h-5" />}
            trend={data?.metrics.revenueTrend}
            className="from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/20"
            iconClassName="text-emerald-500 bg-emerald-500/10"
            delay={0.1}
          />
          <MetricCard
            title="Vendas aprovadas"
            value={data?.metrics.paidRevenue || "R$ 0,00"}
            isLoading={isLoading}
            icon={<CreditCard className="w-5 h-5" />}
            className="from-blue-500/10 to-blue-500/5 hover:border-blue-500/20"
            iconClassName="text-blue-500 bg-blue-500/10"
            delay={0.2}
          />
          <MetricCard
            title="Vendas pendentes"
            value={data?.metrics.pendingRevenue || "R$ 0,00"}
            isLoading={isLoading}
            icon={<Clock className="w-5 h-5" />}
            className="from-amber-500/10 to-amber-500/5 hover:border-amber-500/20"
            iconClassName="text-amber-500 bg-amber-500/10"
            delay={0.3}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={data?.metrics.conversionRate || "0%"}
            isLoading={isLoading}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={data?.metrics.conversionTrend}
            className="from-purple-500/10 to-purple-500/5 hover:border-purple-500/20"
            iconClassName="text-purple-500 bg-purple-500/10"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Main Chart Section */}
          <div className="xl:col-span-2 min-h-[350px] md:min-h-[400px] lg:min-h-[450px]">
            <RevenueChart
              title="Fluxo de Faturamento"
              data={data?.chartData.map(d => ({ date: d.date, value: d.revenue })) || []}
              isLoading={isLoading}
            />
          </div>

          {/* Side Metrics Section (Unified List Style) */}
          <div className="xl:col-span-1 bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-4 md:p-6 flex flex-col min-h-[350px] md:min-h-[400px] lg:min-h-[450px]">
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Visão Geral</h3>
            <div className="flex flex-col gap-2 md:gap-3 flex-1 justify-center overflow-y-auto pr-2 custom-scrollbar">
              {[
                {
                  title: "Vendas Aprovadas",
                  value: data?.metrics.totalPaidOrders || 0,
                  icon: <CheckCircle2 className="w-5 h-5 text-white" />,
                  bg: "from-emerald-500/20 to-emerald-600/20",
                  glow: "group-hover:shadow-emerald-500/20",
                  iconBg: "bg-emerald-500",
                  delay: 0
                },
                {
                  title: "Vendas Pendentes",
                  value: data?.metrics.totalPendingOrders || 0,
                  icon: <AlertCircle className="w-5 h-5 text-white" />,
                  bg: "from-amber-500/20 to-amber-600/20",
                  glow: "group-hover:shadow-amber-500/20",
                  iconBg: "bg-amber-500",
                  delay: 0.1
                },
                {
                  title: "Ticket Médio",
                  value: data?.metrics.averageTicket || "R$ 0,00",
                  icon: <Tags className="w-5 h-5 text-white" />,
                  bg: "from-blue-500/20 to-blue-600/20",
                  glow: "group-hover:shadow-blue-500/20",
                  iconBg: "bg-blue-500",
                  delay: 0.2
                },
                {
                  title: "Vendas por Pix",
                  value: data?.metrics.pixRevenue || "R$ 0,00",
                  icon: <QrCode className="w-5 h-5 text-white" />,
                  bg: "from-teal-500/20 to-teal-600/20",
                  glow: "group-hover:shadow-teal-500/20",
                  iconBg: "bg-teal-500",
                  delay: 0.3
                },
                {
                  title: "Vendas por cartão",
                  value: data?.metrics.creditCardRevenue || "R$ 0,00",
                  icon: <CreditCard className="w-5 h-5 text-white" />,
                  bg: "from-purple-500/20 to-purple-600/20",
                  glow: "group-hover:shadow-purple-500/20",
                  iconBg: "bg-purple-500",
                  delay: 0.4
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: item.delay }}
                  className={`flex items-center justify-between p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-muted/50 to-transparent border border-border hover:border-primary/20 transition-all duration-300 group hover:scale-[1.02] cursor-default ${item.glow} hover:shadow-xl`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl ${item.iconBg} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/20`}>
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.title}</span>
                      <span className="text-sm md:text-base font-bold text-foreground tracking-tight group-hover:tracking-normal transition-all">{item.value}</span>
                    </div>
                  </div>
                  <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${item.bg} opacity-20 group-hover:opacity-100 transition-opacity`} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 md:pt-6 lg:pt-8">
        <RecentCustomersTable
          customers={data?.recentCustomers || []}
          isLoading={isLoading}
          onRefresh={() => refetch()}
        />
      </div>


    </motion.div>
  );
};

export default Index;
